import { DEFAULT_VERSION, getZoneControlData } from "@/lib/data";
import { ZoneControlItem } from "@/app/types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

// test: ?a=20260209T040828&b=20260209T150828

export default async function CompareVersionsPage({
  searchParams,
}: {
  searchParams: Promise<{ a: string; b: string }>;
}) {
  const { a, b } = await searchParams;
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groupList.map((group) => (
          <Card key={`${group.province}-${group.zone}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {group.province} เขต {group.zone}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
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
