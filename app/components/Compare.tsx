import { getZoneControlData, getZonePartyListControlData } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Compare = async () => {
  const zonePartyListControl = await getZonePartyListControlData();
  const zoneControl = await getZoneControlData();
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
