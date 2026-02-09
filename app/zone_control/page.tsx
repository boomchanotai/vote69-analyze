import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ZoneControlItem } from "../types";
import ZoneControl from "../zone_control.json";
import { Compare } from "../components/Compare";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function ZoneControlPage() {
  const zoneControl = (ZoneControl as ZoneControlItem[]).sort((a, b) => {
    const provinceDiff =
      Number(a.info_zone.province_id) - Number(b.info_zone.province_id);
    if (provinceDiff !== 0) return provinceDiff;
    return Number(a.info_zone.zone) - Number(b.info_zone.zone);
  });

  return (
    <div className="p-8 space-y-2">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-2xl">Zone Control</h2>
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Province</TableHead>
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
                <TableCell>{item.info_zone.province}</TableCell>
                <TableCell>{item.info_zone.zone}</TableCell>
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
