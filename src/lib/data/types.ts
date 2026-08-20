export interface Batch {
  id: string; // UUID
  species_claimed: string;
  species_ai_result: string;
  confidence_score: number; // 0–1 decimal, e.g. 0.87
  gps_lat: number;
  gps_lon: number;
  harvester_id: string;
  photo_url: string;
  timestamp: string; // ISO 8601
  qc_status: "pending" | "pass" | "fail";
  prev_hash: string | null;
  hash: string;
  payment_status: "pending" | "released";
}

export interface Harvester {
  id: string;
  name: string;
  wallet_balance: number;
}

export interface OverharvestZone {
  id: string;
  region: string;
  depletion_score: number;
  lat: number;
  lon: number;
}

export type NewBatchInput = Omit<
  Batch,
  "id" | "hash" | "prev_hash" | "qc_status" | "payment_status"
>;
