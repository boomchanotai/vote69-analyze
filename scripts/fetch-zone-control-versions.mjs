#!/usr/bin/env node
/**
 * Brute-force discover zone_control.json versions from the election API.
 * Focus: 8 Feb 2569 (2026) from 19:00 to 23:59:59 Bangkok time (UTC+7).
 * URL timestamps are in UTC (GMT+0), so 19:00 BKK = 12:00 UTC, 23:59 BKK = 16:59 UTC.
 * Progress is saved to a state file; re-run to continue from where you left off.
 *
 * Usage: node scripts/fetch-zone-control-versions.mjs [--step=1] [--delay=200] [--state=path]
 *   --step   minute step (default 1 = every minute)
 *   --delay  ms between requests (default 200 to be nice to the server)
 *   --state  path to state file (default: scripts/zone-control-versions-state.json)
 */

const BASE = "https://election69.prd.go.th/data/live/versions";

// 8/2/2569 → 2026-02-08. 19:00 BKK = 12:00 UTC, 23:59 BKK = 16:59 UTC
const START_UTC = { y: 2026, m: 2, d: 8, h: 12, min: 0, s: 0 };
const END_UTC = { y: 2026, m: 2, d: 8, h: 16, min: 59, s: 59 };

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toVersionTag({ y, m, d, h, min, s }) {
  return `${y}${pad2(m)}${pad2(d)}T${pad2(h)}${pad2(min)}${pad2(s)}`;
}

function* minuteRange(start, end, stepMinutes = 1) {
  const toMins = (t) => t.h * 60 + t.min;
  const fromMins = (total) => {
    const h = Math.floor(total / 60);
    const min = total % 60;
    return { ...start, h, min };
  };
  let total = toMins(start);
  const endTotal = toMins(end);
  while (total <= endTotal) {
    yield fromMins(total);
    total += stepMinutes;
  }
}

async function checkVersion(versionTag) {
  const url = `${BASE}/${versionTag}/zone_control.json`;
  try {
    let res = await fetch(url, { method: "HEAD" });
    if (res.status === 405) res = await fetch(url, { method: "GET" });
    return res.ok;
  } catch (e) {
    return false;
  }
}

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v !== undefined ? v : true];
  }),
);
const step = parseInt(args.step || "1", 10);
const delayMs = parseInt(args.delay || "200", 10);
const statePath =
  args.state ||
  new URL("zone-control-versions-state.json", import.meta.url).pathname;

const fs = await import("fs");
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Load previous state: { "versionTag": true|false, ... }
let state = {};
try {
  const raw = fs.readFileSync(statePath, "utf8");
  state = JSON.parse(raw);
} catch {
  // no state file or invalid
}

function saveState() {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 0), "utf8");
}

const allTags = [...minuteRange(START_UTC, END_UTC, step)].map(toVersionTag);
let checked = 0;
let skipped = 0;

for (const tag of allTags) {
  if (state[tag] !== undefined) {
    skipped++;
    console.log(`${tag}  ${state[tag] ? "found" : "not found"} (cached)`);
    continue;
  }
  const ok = await checkVersion(tag);
  state[tag] = ok;
  saveState();
  checked++;
  console.log(`${tag}  ${ok ? "found" : "not found"}`);
  await delay(delayMs);
}

const versions = allTags.filter((tag) => state[tag] === true).sort();

console.log("\n--- Summary ---");
console.log(
  `Found ${versions.length} version(s) for 8/2/2569 19:00–23:59 BKK (step=${step} min, delay=${delayMs}ms).`,
);
console.log(
  `This run: ${checked} checked, ${skipped} from cache. State: ${statePath}`,
);
versions.forEach((v) => console.log(v));

const outFile = args.output || args.o;
if (outFile) {
  fs.writeFileSync(outFile, versions.join("\n") + "\n", "utf8");
  console.log(`\nWrote ${versions.length} versions to ${outFile}`);
}
