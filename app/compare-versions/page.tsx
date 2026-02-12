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
import {
  ZoneSortSelect,
  type SortOption,
  type SortVersion,
} from "./ZoneSortSelect";

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
  searchParams: Promise<{
    a?: string;
    b?: string;
    party?: string;
    sort?: string;
    sortVer?: string;
    sortTotal?: string;
  }>;
}) {
  const {
    a,
    b,
    party: partyFilter,
    sort: sortParam,
    sortVer: sortVerParam,
    sortTotal: sortTotalParam,
  } = await searchParams;
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

  // Sort by invalid_vote % or turnout % (using version A or B), optional
  const sortOption = (
    ["", "invalid_asc", "invalid_desc", "turnout_asc", "turnout_desc"].includes(
      sortParam ?? "",
    )
      ? (sortParam ?? "")
      : ""
  ) as SortOption;

  const sortByTotal = sortTotalParam === "1";

  const sortVer: SortVersion = sortVerParam === "b" ? "b" : "a";

  const zoneInfoForSort = sortVer === "b" ? zoneInfoByIdB : zoneInfoByIdA;

  const getZoneId = (group: (typeof groupList)[number]) =>
    group.keys[0].split("-").slice(0, -1).join("-");

  const sortedGroupList = [...filteredGroupList].sort((ga, gb) => {
    const idA = getZoneId(ga);
    const idB = getZoneId(gb);

    if (sortByTotal) {
      const infoA_A = zoneInfoByIdA.get(idA);
      const infoA_B = zoneInfoByIdB.get(idA);
      const infoB_A = zoneInfoByIdA.get(idB);
      const infoB_B = zoneInfoByIdB.get(idB);
      const diffA =
        (infoA_B?.total_vote ?? 0) - (infoA_A?.total_vote ?? 0);
      const diffB =
        (infoB_B?.total_vote ?? 0) - (infoB_A?.total_vote ?? 0);

      const aZero = diffA === 0;
      const bZero = diffB === 0;

      if (aZero && !bZero) return 1; // move A (zero) after B (non-zero)
      if (!aZero && bZero) return -1; // move A (non-zero) before B (zero)

      return diffB - diffA; // among non-zero (or both zero), DESC by diff
    }

    if (!sortOption) return 0;

    const infoA = zoneInfoForSort.get(idA);
    const infoB = zoneInfoForSort.get(idB);
    const invalidPct = (info: typeof infoA) =>
      info && info.total_vote ? (info.invalid_vote / info.total_vote) * 100 : 0;
    const turnoutPct = (info: typeof infoA) =>
      info && info.eligible ? (info.total_vote / info.eligible) * 100 : 0;
    if (
      sortOption === "invalid_asc" ||
      sortOption === "invalid_desc" ||
      sortOption === "turnout_asc" ||
      sortOption === "turnout_desc"
    ) {
      const isInvalid =
        sortOption === "invalid_asc" || sortOption === "invalid_desc";
      const asc = sortOption === "invalid_asc" || sortOption === "turnout_asc";
      const aVal = isInvalid ? invalidPct(infoA) : turnoutPct(infoA);
      const bVal = isInvalid ? invalidPct(infoB) : turnoutPct(infoB);
      const d = aVal - bVal;
      return asc ? d : -d;
    }
    return 0;
  });

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

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Filter zone by party rank 1:
          </span>
          <ZonePartyFilter
            parties={partyList}
            currentPartyId={partyFilter ?? null}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort:</span>
          <ZoneSortSelect currentSort={sortOption} currentSortVer={sortVer} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedGroupList.map((group) => (
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
                const pctInvalid = (inv: number, total: number) =>
                  total ? (inv / total) * 100 : 0;
                const pctTurnout = (total: number, eligible: number) =>
                  eligible ? (total / eligible) * 100 : 0;
                const INVALID_PCT_THRESHOLD = 10;

                return (
                  <div className="mb-4 rounded-md border p-3 text-sm">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-auto"></TableHead>
                          <TableHead className="text-right">A</TableHead>
                          <TableHead className="text-right">B</TableHead>
                          <TableHead className="text-right">Diff</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map(({ label, key }) => {
                          const a = infoA?.[key] ?? 0;
                          const b = infoB?.[key] ?? 0;
                          const diff =
                            typeof a === "number" && typeof b === "number"
                              ? b - a
                              : null;
                          const isInvalidVote = key === "invalid_vote";
                          const isEligible = key === "eligible";
                          const totalA = infoA?.total_vote ?? 0;
                          const totalB = infoB?.total_vote ?? 0;
                          const eligibleA = infoA?.eligible ?? 0;
                          const eligibleB = infoB?.eligible ?? 0;
                          const pctA = isInvalidVote
                            ? pctInvalid(typeof a === "number" ? a : 0, totalA)
                            : null;
                          const pctB = isInvalidVote
                            ? pctInvalid(typeof b === "number" ? b : 0, totalB)
                            : null;
                          const turnoutA = isEligible
                            ? pctTurnout(totalA, eligibleA)
                            : null;
                          const turnoutB = isEligible
                            ? pctTurnout(totalB, eligibleB)
                            : null;
                          const redA =
                            isInvalidVote &&
                            pctA !== null &&
                            pctA > INVALID_PCT_THRESHOLD;
                          const redB =
                            isInvalidVote &&
                            pctB !== null &&
                            pctB > INVALID_PCT_THRESHOLD;

                          return (
                            <TableRow key={key}>
                              <TableCell className="text-muted-foreground">
                                {label}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "text-right",
                                  redA && "text-red-600 font-medium",
                                )}
                              >
                                {typeof a === "number" ? (
                                  isInvalidVote && totalA > 0 ? (
                                    <>
                                      {a.toLocaleString()}{" "}
                                      <span className="text-muted-foreground">
                                        ({(pctA ?? 0).toFixed(1)}%)
                                      </span>
                                    </>
                                  ) : isEligible && eligibleA > 0 ? (
                                    <>
                                      {a.toLocaleString()}{" "}
                                      <span className="text-muted-foreground">
                                        ({(turnoutA ?? 0).toFixed(1)}% turnout)
                                      </span>
                                    </>
                                  ) : (
                                    a.toLocaleString()
                                  )
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "text-right",
                                  redB && "text-red-600 font-medium",
                                )}
                              >
                                {typeof b === "number" ? (
                                  isInvalidVote && totalB > 0 ? (
                                    <>
                                      {b.toLocaleString()}{" "}
                                      <span className="text-muted-foreground">
                                        ({(pctB ?? 0).toFixed(1)}%)
                                      </span>
                                    </>
                                  ) : isEligible && eligibleB > 0 ? (
                                    <>
                                      {b.toLocaleString()}{" "}
                                      <span className="text-muted-foreground">
                                        ({(turnoutB ?? 0).toFixed(1)}% turnout)
                                      </span>
                                    </>
                                  ) : (
                                    b.toLocaleString()
                                  )
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "text-right",
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
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
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
