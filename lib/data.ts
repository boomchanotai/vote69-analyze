import { ZoneControlItem, ZonePartyListControlItem } from "@/app/types";

export const getZoneControlData = async () => {
  const res = await fetch(
    "https://election69.prd.go.th/data/live/versions/20260209T130828/zone_control.json",
    {
      // Always fetch latest live data
      cache: "no-store",
    },
  );

  if (!res.ok) {
    throw new Error("Failed to fetch zone_control data");
  }

  const json = (await res.json()) as ZoneControlItem[];

  const zoneControl = json.sort((a, b) => {
    const provinceDiff =
      Number(a.info_zone.province_id) - Number(b.info_zone.province_id);
    if (provinceDiff !== 0) return provinceDiff;
    return Number(a.info_zone.zone) - Number(b.info_zone.zone);
  });

  return zoneControl;
};

export const getZonePartyListControlData = async () => {
  const res = await fetch(
    "https://election69.prd.go.th/data/live/versions/20260209T130828/zone_partylist_control.json",
    {
      // Always fetch latest live data
      cache: "no-store",
    },
  );

  if (!res.ok) {
    throw new Error("Failed to fetch zone_partylist_control data");
  }

  const json = (await res.json()) as ZonePartyListControlItem[];

  const zonePartyListControl = json.sort((a, b) => {
    const provinceDiff =
      Number(a.info_zone.province_id) - Number(b.info_zone.province_id);
    if (provinceDiff !== 0) return provinceDiff;
    return Number(a.info_zone.zone) - Number(b.info_zone.zone);
  });

  return zonePartyListControl;
};
