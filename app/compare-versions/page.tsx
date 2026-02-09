import { DEFAULT_VERSION, getZoneControlData } from "@/lib/data";
import { ZoneControlItem } from "@/app/types";
import { cn } from "@/lib/utils";

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

      <div className="flex flex-wrap gap-6 items-center rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
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
          <span className="text-muted-foreground text-sm">Diff (B − A): </span>
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
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b">
              <th className="px-2 py-1 text-left">Province</th>
              <th className="px-2 py-1 text-left">Zone</th>
              <th className="px-2 py-1 text-left">Candidate No</th>
              <th className="px-2 py-1 text-left">First Name</th>
              <th className="px-2 py-1 text-left">Last Name</th>
              <th className="px-2 py-1 text-left">Party</th>
              <th className="px-2 py-1 text-right">Votes (A)</th>
              <th className="px-2 py-1 text-right">Votes (B)</th>
              <th className="px-2 py-1 text-right">Diff (B - A)</th>
            </tr>
          </thead>
          <tbody>
            {allKeys.map((key) => {
              const a = mapA.get(key);
              const b = mapB.get(key);
              const zone = (a ?? b)!.zone;
              const candidate = (a ?? b)!.candidate;

              const votesA = a?.candidate.vote ?? 0;
              const votesB = b?.candidate.vote ?? 0;
              const diff = votesB - votesA;

              return (
                <tr key={key} className="border-b">
                  <td className="px-2 py-1">{zone.province}</td>
                  <td className="px-2 py-1">{zone.zone}</td>
                  <td className="px-2 py-1 text-right">
                    {candidate.candidate_no}
                  </td>
                  <td className="px-2 py-1">{candidate.first_name}</td>
                  <td className="px-2 py-1">{candidate.last_name}</td>
                  <td className="px-2 py-1">{candidate.party}</td>
                  <td className="px-2 py-1 text-right">{votesA}</td>
                  <td className="px-2 py-1 text-right">{votesB}</td>
                  <td
                    className={cn(
                      "px-2 py-1 text-right",
                      diff === 0
                        ? "text-muted-foreground"
                        : diff > 0
                          ? "text-green-600"
                          : "text-red-600",
                    )}
                  >
                    {diff}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
