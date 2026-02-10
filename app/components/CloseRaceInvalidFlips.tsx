import { ZoneControlItem } from "@/app/types";
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

const DEFAULT_MARGIN_SIGNIFICANT_PCT = 10;

/**
 * Margin = (Rank 1 votes) − (Rank 2 votes).
 * It is the lead the winner has over the runner-up. If invalid votes ≥ margin,
 * then reassigning all invalid votes to Rank 2 could theoretically make Rank 2 win.
 */

export type CloseRaceRow = {
  province: string;
  zone: string;
  zoneId: string;
  rank1: { party: string; name: string; votes: number };
  rank2: { party: string; name: string; votes: number };
  /** Lead of Rank 1 over Rank 2: rank1.votes − rank2.votes */
  margin: number;
  invalidVote: number;
  totalVote: number;
  marginPct: number;
};

function computeCloseRaceInvalidFlips(
  zoneControl: ZoneControlItem[],
  marginSignificantPct: number,
): CloseRaceRow[] {
  const rows: CloseRaceRow[] = [];
  for (const item of zoneControl) {
    const info = item.info_zone;
    const r1 = item.data.find((c) => c.rank === 1);
    const r2 = item.data.find((c) => c.rank === 2);
    if (!r1 || !r2) continue;
    // Margin = winner's votes − runner-up's votes (the gap Rank 2 must overcome)
    const margin = r1.vote - r2.vote;
    if (margin <= 0) continue;
    const totalVote = info.total_vote ?? 0;
    const invalidVote = info.invalid_vote ?? 0;
    const marginPct = totalVote ? (margin / totalVote) * 100 : 0;
    const notSignificant = marginPct < marginSignificantPct;
    const invalidCouldFlip = invalidVote >= margin;
    if (notSignificant && invalidCouldFlip) {
      rows.push({
        province: info.province,
        zone: info.zone,
        zoneId: info.zone_id,
        rank1: {
          party: r1.party,
          name: `${r1.first_name} ${r1.last_name}`.trim(),
          votes: r1.vote,
        },
        rank2: {
          party: r2.party,
          name: `${r2.first_name} ${r2.last_name}`.trim(),
          votes: r2.vote,
        },
        margin,
        invalidVote,
        totalVote,
        marginPct,
      });
    }
  }
  return rows;
}

export type SortInvalidOrder = "asc" | "desc" | "";

export function CloseRaceInvalidFlips({
  zoneControl,
  marginSignificantPct = DEFAULT_MARGIN_SIGNIFICANT_PCT,
  sortInvalidOrder,
}: {
  zoneControl: ZoneControlItem[];
  marginSignificantPct?: number;
  /** Optional: sort by invalid votes asc or desc */
  sortInvalidOrder?: SortInvalidOrder;
}) {
  let rows = computeCloseRaceInvalidFlips(zoneControl, marginSignificantPct);

  if (sortInvalidOrder === "asc") {
    rows = [...rows].sort((a, b) => a.invalidVote - b.invalidVote);
  } else if (sortInvalidOrder === "desc") {
    rows = [...rows].sort((a, b) => b.invalidVote - a.invalidVote);
  }

  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          สส. เขต where Rank 1 & 2 are close and invalid votes could flip Rank 2
          → Rank 1
        </CardTitle>
        <CardDescription>
          Margin = Rank 1 votes − Rank 2 votes (winner’s lead). Shown where
          margin &lt; {marginSignificantPct}% of total votes and invalid votes ≥
          margin (enough invalid votes could theoretically flip Rank 2 to win).
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zone</TableHead>
              <TableHead>Rank 1 (party, name, votes)</TableHead>
              <TableHead>Rank 2 (party, name, votes)</TableHead>
              <TableHead className="text-right">Margin (R1−R2)</TableHead>
              <TableHead className="text-right">Invalid votes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.zoneId}>
                <TableCell>
                  {row.province} เขต {row.zone}
                </TableCell>
                <TableCell className="text-sm">
                  {row.rank1.party} — {row.rank1.name} —{" "}
                  <span className="font-medium">
                    {row.rank1.votes.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="text-sm">
                  {row.rank2.party} — {row.rank2.name} —{" "}
                  <span className="font-medium">
                    {row.rank2.votes.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {row.margin.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-red-600">
                  {row.invalidVote.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
