import ZonePartyListControl from "../zone_partylist_control.json";
import ZoneControl from "../zone_control.json";
import { ZoneControlItem, ZonePartyListControlItem } from "../types";
import { cn } from "@/lib/utils";

export const Compare = () => {
  const zonePartyListControl =
    ZonePartyListControl as ZonePartyListControlItem[];
  const zoneControl = ZoneControl as ZoneControlItem[];
  const totalZonePartyListControlVotes = zonePartyListControl.reduce(
    (acc, curr) => acc + curr.info_zone.total_vote,
    0,
  );
  const totalZoneControlVotes = zoneControl.reduce(
    (acc, curr) => acc + curr.info_zone.total_vote,
    0,
  );
  const diff = totalZoneControlVotes - totalZonePartyListControlVotes;

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
          <div>Total PartyList Votes: {totalZonePartyListControlVotes}</div>
          <div>Total Zone Votes: {totalZoneControlVotes}</div>
        </div>
        <div>
          Diff:{" "}
          <span
            className={cn({
              "text-green-500": diff === 0,
              "text-red-500": diff !== 0,
            })}
          >
            {diff}
          </span>
        </div>
      </div>
    </div>
  );
};
