import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Compare } from "../components/Compare";
import { CloseRaceInvalidFlips } from "../components/CloseRaceInvalidFlips";
import { CloseRaceInvalidFlipsSortSelect } from "../components/CloseRaceInvalidFlipsSortSelect";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { getLatestVersion, getZoneControlData } from "@/lib/data";

export default async function ZoneControlPage({
  searchParams,
}: {
  searchParams: Promise<{ version?: string; sortInvalid?: string }>;
}) {
  const { version, sortInvalid } = await searchParams;
  const versionToUse = version ?? (await getLatestVersion());
  const zoneControl = await getZoneControlData(versionToUse);

  const sortInvalidOrder =
    sortInvalid === "asc" || sortInvalid === "desc" ? sortInvalid : "";

  return (
    <div className="p-8 space-y-2">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-bold text-2xl">Zone Control</h2>
          <div>(Version: {versionToUse})</div>
        </div>
        <div>
          <Link href="/">
            <Button>
              Zone Party List Control <ArrowRight />
            </Button>
          </Link>
        </div>
      </div>
      <div>{zoneControl.length} zones</div>
      <Compare />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Close-race zones sort by invalid:
        </span>
        <CloseRaceInvalidFlipsSortSelect currentSort={sortInvalidOrder} />
      </div>
      <CloseRaceInvalidFlips
        zoneControl={zoneControl}
        sortInvalidOrder={sortInvalidOrder}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Zone</TableHead>
            <TableHead>มีสิทธิ์</TableHead>
            <TableHead>โหวตทั้งหมด</TableHead>
            <TableHead>Good</TableHead>
            <TableHead>Invalid</TableHead>
            <TableHead>No</TableHead>
            <TableHead>Sum of Good, Invalid, No</TableHead>
            <TableHead>Sum of All Votes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {zoneControl.map((item, index) => {
            const sumOfGoodInvalidNo =
              item.info_zone.good_vote +
              item.info_zone.invalid_vote +
              item.info_zone.no_vote;

            const sumOfAllVotes = item.data.reduce(
              (acc, curr) => acc + curr.vote,
              0,
            );

            return (
              <TableRow key={index}>
                <TableCell>
                  {item.info_zone.province} เขต {item.info_zone.zone}
                </TableCell>
                <TableCell>{item.info_zone.eligible}</TableCell>
                <TableCell>{item.info_zone.total_vote}</TableCell>
                <TableCell>{item.info_zone.good_vote}</TableCell>
                <TableCell>{item.info_zone.invalid_vote}</TableCell>
                <TableCell>{item.info_zone.no_vote}</TableCell>
                <TableCell
                  className={cn({
                    "text-green-500":
                      sumOfGoodInvalidNo === item.info_zone.total_vote,
                    "text-red-500":
                      sumOfGoodInvalidNo !== item.info_zone.total_vote,
                  })}
                >
                  {sumOfGoodInvalidNo}
                </TableCell>
                <TableCell
                  className={cn({
                    "text-green-500":
                      sumOfAllVotes === item.info_zone.good_vote,
                    "text-red-500": sumOfAllVotes !== item.info_zone.good_vote,
                  })}
                >
                  {sumOfAllVotes}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
