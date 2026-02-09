import { DEFAULT_VERSION, getZoneControlData } from "@/lib/data";
import { ZoneControlItem } from "@/app/types";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ZonePartyFilter } from "./ZonePartyFilter";

type CandidateKey = string;

function buildCandidateMap(items: ZoneControlItem[]) {
  const map = new Map<
    CandidateKey,
    {
      zone: ZoneControlItem["info_zone"];
      candidate: ZoneControlItem["data"][number];
    }
  >();

  for (const zone of items) {
    for (const candidate of zone.data) {
      const key = `${zone.info_zone.zone_id}-${candidate.candidate_no}`;
      map.set(key, { zone: zone.info_zone, candidate });
    }
  }

  return map;
}

// Parse YYYYMMDDTHHmmss and format in Thai timezone (Asia/Bangkok)
function formatVersionToThaiTime(version: string): string {
  const m = version.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/);
  if (!m) return version;
  const [, y, mo, d, h, min, s] = m;
  const date = new Date(Date.UTC(+y, +mo - 1, +d, +h, +min, +s));
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
  }).format(date);
}

// test: ?a=20260209T040828&b=20260209T150828

export default async function CompareVersionsPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string; party?: string }>;
}) {
  const { a, b, party: partyFilter } = await searchParams;
  const versionA = a ?? DEFAULT_VERSION;
  const versionB = b ?? DEFAULT_VERSION;

  const [zoneA, zoneB] = await Promise.all([
    getZoneControlData(versionA),
    getZoneControlData(versionB),
  ]);

  const mapA = buildCandidateMap(zoneA);
  const mapB = buildCandidateMap(zoneB);

  const totalVotesA = zoneA.reduce((acc, z) => acc + z.info_zone.total_vote, 0);
  const totalVotesB = zoneB.reduce((acc, z) => acc + z.info_zone.total_vote, 0);
  const totalVotesDiff = totalVotesB - totalVotesA;

  const allKeys = Array.from(new Set([...mapA.keys(), ...mapB.keys()])).sort(
    (ka, kb) => {
      const a = mapA.get(ka) ?? mapB.get(ka)!;
      const b = mapA.get(kb) ?? mapB.get(kb)!;

      const provinceDiff =
        Number(a.zone.province_id) - Number(b.zone.province_id);
      if (provinceDiff !== 0) return provinceDiff;

      const zoneDiff = Number(a.zone.zone) - Number(b.zone.zone);
      if (zoneDiff !== 0) return zoneDiff;

      const [, candNoA] = ka.split("-");
      const [, candNoB] = kb.split("-");
      return Number(candNoA) - Number(candNoB);
    },
  );

  // Group by province + zone
  const groupKey = (key: CandidateKey) => {
    const item = mapA.get(key) ?? mapB.get(key)!;
    return `${item.zone.province_id}-${item.zone.zone}`;
  };
  const groups = new Map<
    string,
    { province: string; zone: string; keys: CandidateKey[] }
  >();
  for (const key of allKeys) {
    const item = mapA.get(key) ?? mapB.get(key)!;
    const gk = groupKey(key);
    if (!groups.has(gk)) {
      groups.set(gk, {
        province: item.zone.province,
        zone: item.zone.zone,
        keys: [],
      });
    }
    groups.get(gk)!.keys.push(key);
  }
  const groupList = Array.from(groups.values());

  // Zone info by zone_id for lookup per card (total_vote, eligible, good_vote, invalid_vote, no_vote)
  const zoneInfoByIdA = new Map(
    zoneA.map((z) => [z.info_zone.zone_id, z.info_zone]),
  );
  const zoneInfoByIdB = new Map(
    zoneB.map((z) => [z.info_zone.zone_id, z.info_zone]),
  );

  // Distinct parties (from version A) for the filter
  const partySet = new Map<string, string>();
  for (const [, entry] of mapA) {
    const { party_id, party } = entry.candidate;
    if (!partySet.has(party_id)) partySet.set(party_id, party);
  }
  const partyList = Array.from(partySet.entries())
    .map(([party_id, party]) => ({ party_id, party }))
    .sort((a, b) => Number(a.party_id) - Number(b.party_id));

  // Optional filter: only zones where this party has rank 1 (using version A)
  const filteredGroupList = partyFilter
    ? groupList.filter((group) => {
        const hasPartyRank1 = group.keys.some((key) => {
          const item = mapA.get(key);
          const c = item?.candidate;
          return c && c.rank === 1 && c.party_id === partyFilter;
        });
        return hasPartyRank1;
      })
    : groupList;

  return (
    <div className="p-8 space-y-4">
      <h2 className="font-bold text-2xl">Compare Zone Control Versions</h2>
      <div className="text-sm text-muted-foreground">
        Comparing version {versionA} with {versionB}. You can change versions by
        editing the URL query parameters, for example:
        <br />
        <code>
          /compare-versions?a={versionA}&b={versionB}
        </code>
      </div>

      <Card>
        <CardContent className="flex flex-wrap gap-6 items-center">
          <div>
            <span className="text-muted-foreground text-sm">
              Total votes (A):{" "}
            </span>
            <span className="font-medium">{totalVotesA.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-sm">
              Total votes (B):{" "}
            </span>
            <span className="font-medium">{totalVotesB.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-sm">
              Diff (B − A):{" "}
            </span>
            <span
              className={cn(
                "font-medium",
                totalVotesDiff === 0
                  ? "text-muted-foreground"
                  : totalVotesDiff > 0
                    ? "text-green-600"
                    : "text-red-600",
              )}
            >
              {totalVotesDiff >= 0 ? "+" : ""}
              {totalVotesDiff.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Filter zone by party rank 1:
        </span>
        <ZonePartyFilter
          parties={partyList}
          currentPartyId={partyFilter ?? null}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredGroupList.map((group) => (
          <Card key={`${group.province}-${group.zone}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {group.province} เขต {group.zone}
              </CardTitle>
              <CardDescription>
                เปรียบเทียบระหว่าง {formatVersionToThaiTime(versionA)} (A) กับ{" "}
                {formatVersionToThaiTime(versionB)} (B)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {(() => {
                const zoneId = group.keys[0].split("-").slice(0, -1).join("-");
                const infoA = zoneInfoByIdA.get(zoneId);
                const infoB = zoneInfoByIdB.get(zoneId);
                const rows: {
                  label: string;
                  key:
                    | "total_vote"
                    | "eligible"
                    | "good_vote"
                    | "invalid_vote"
                    | "no_vote";
                }[] = [
                  { label: "Total vote", key: "total_vote" },
                  { label: "Eligible", key: "eligible" },
                  { label: "Good vote", key: "good_vote" },
                  { label: "Invalid vote", key: "invalid_vote" },
                  { label: "No vote", key: "no_vote" },
                ];
                return (
                  <div className="mb-4 rounded-md border p-3 text-sm">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b">
                          <th className="py-1 pr-2 font-medium"></th>
                          <th className="py-1 px-2 text-right font-medium">
                            A
                          </th>
                          <th className="py-1 px-2 text-right font-medium">
                            B
                          </th>
                          <th className="py-1 px-2 text-right font-medium">
                            Diff
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(({ label, key }) => {
                          const a = infoA?.[key] ?? 0;
                          const b = infoB?.[key] ?? 0;
                          const diff =
                            typeof a === "number" && typeof b === "number"
                              ? b - a
                              : null;
                          return (
                            <tr key={key} className="border-b last:border-0">
                              <td className="py-1 pr-2 text-muted-foreground">
                                {label}
                              </td>
                              <td className="py-1 px-2 text-right">
                                {typeof a === "number"
                                  ? a.toLocaleString()
                                  : "-"}
                              </td>
                              <td className="py-1 px-2 text-right">
                                {typeof b === "number"
                                  ? b.toLocaleString()
                                  : "-"}
                              </td>
                              <td
                                className={cn(
                                  "py-1 px-2 text-right",
                                  diff !== null && diff !== 0
                                    ? diff > 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                    : "text-muted-foreground",
                                )}
                              >
                                {diff !== null
                                  ? (diff >= 0 ? "+" : "") +
                                    diff.toLocaleString()
                                  : "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead className="text-right">Vote (A)</TableHead>
                    <TableHead className="text-right">Vote (B)</TableHead>
                    <TableHead className="text-right">Diff</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.keys.map((key) => {
                    const a = mapA.get(key);
                    const b = mapB.get(key);
                    const candidate = (a ?? b)!.candidate;
                    const votesA = a?.candidate.vote ?? 0;
                    const votesB = b?.candidate.vote ?? 0;
                    const diff = votesB - votesA;
                    return (
                      <TableRow key={key}>
                        <TableCell>{candidate.rank}</TableCell>
                        <TableCell>
                          {candidate.party} ({candidate.party_id})
                        </TableCell>
                        <TableCell>{candidate.first_name}</TableCell>
                        <TableCell>{candidate.last_name}</TableCell>
                        <TableCell className="text-right">{votesA}</TableCell>
                        <TableCell className="text-right">{votesB}</TableCell>
                        <TableCell
                          className={cn(
                            "text-right",
                            diff === 0
                              ? "text-muted-foreground"
                              : diff > 0
                                ? "text-green-600"
                                : "text-red-600",
                          )}
                        >
                          {diff}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
