export type InfoZone = {
  zone_id: string;
  region_id: string;
  region: string;
  province_id: string;
  province: string;
  zone: string;
  detail: string | null;
  total_vote: number;
  good_vote: number;
  invalid_vote: number;
  no_vote: number;
  eligible: number;
  percent_turnout: number;
  progress: number;
  is_winner: boolean;
  is_outscored: boolean;
  is_final: boolean;
};

export type ZonePartyListControlDataItem = {
  rank: number;
  vote: number;
  "%vote": number;
  party_id: string;
  party: string;
  party_color: string;
  party_short_name: string | null;
  logo: string;
  image_barchart: string | null;
};

export type ZonePartyListControlItem = {
  info_zone: InfoZone;
  data: ZonePartyListControlDataItem[];
};

export type ZoneControlInfoZone = InfoZone & {
  total_seat: number;
};

export type ZoneControlDataItem = {
  rank: number;
  vote: number;
  "%vote": number;
  candidate_no: number;
  people_id: string;
  first_name: string;
  last_name: string;
  people_image: string;
  party_id: string;
  party: string;
  party_color: string;
  party_short_name: string | null;
};

export type ZoneControlItem = {
  info_zone: ZoneControlInfoZone;
  data: ZoneControlDataItem[];
};
