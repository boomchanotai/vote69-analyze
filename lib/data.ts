import { ZoneControlItem, ZonePartyListControlItem } from "@/app/types";

export const DEFAULT_VERSION = "20260209T120828";

export const getLatestVersion = async () => {
  const res = await fetch(
    "https://election69.prd.go.th/data/live/latest.json",
    {
      cache: "no-store",
    },
  );

  if (!res.ok) {
    throw new Error("Failed to fetch latest version");
  }

  const json = (await res.json()) as { folder: string };
  return json.folder;
};

export const getZoneControlData = async (version?: string) => {
  const versionToUse = version ?? DEFAULT_VERSION;

  const res = await fetch(
    `https://election69.prd.go.th/data/live/versions/${versionToUse}/zone_control.json`,
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

export const getZonePartyListControlData = async (version?: string) => {
  const versionToUse = version ?? DEFAULT_VERSION;

  const res = await fetch(
    `https://election69.prd.go.th/data/live/versions/${versionToUse}/zone_partylist_control.json`,
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
