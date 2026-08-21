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
  // Fields present in real API responses — added for live integration
  quantity_kg: number;
  qc_notes: string | null;
  qc_timestamp: string | null; // ISO 8601, null until QC decision is made
  payment_amount: number | null; // null until payment is released
}

export interface Harvester {
  id: string;
  name: string;
  wallet_balance: number;
}

export interface OverharvestZone {
  id: string;
  region: string;
  // NOTE: real API returns 0–100 (integer scale), NOT 0–1.
  // The mock uses 0–1. Do not multiply by 100 when displaying live data —
  // that would render "8200%" instead of "82%".
  depletion_score: number;
  lat: number;
  lon: number;
}

export type NewBatchInput = Omit<
  Batch,
  "id" | "hash" | "prev_hash" | "qc_status" | "payment_status" | "qc_notes" | "qc_timestamp" | "payment_amount"
>;
