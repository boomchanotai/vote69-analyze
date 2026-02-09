import ZonePartyListControl from "../data/zone_partylist_control.json";
import ZoneControl from "../data/zone_control.json";
import { ZoneControlItem, ZonePartyListControlItem } from "@/app/types";

export const getZoneControlData = async () => {
  const zoneControl = (ZoneControl as ZoneControlItem[]).sort((a, b) => {
    const provinceDiff =
      Number(a.info_zone.province_id) - Number(b.info_zone.province_id);
    if (provinceDiff !== 0) return provinceDiff;
    return Number(a.info_zone.zone) - Number(b.info_zone.zone);
  });

  return zoneControl;
};

export const getZonePartyListControlData = async () => {
  const zonePartyListControl = (
    ZonePartyListControl as ZonePartyListControlItem[]
  ).sort((a, b) => {
    const provinceDiff =
      Number(a.info_zone.province_id) - Number(b.info_zone.province_id);
    if (provinceDiff !== 0) return provinceDiff;
    return Number(a.info_zone.zone) - Number(b.info_zone.zone);
  });

  return zonePartyListControl;
};
