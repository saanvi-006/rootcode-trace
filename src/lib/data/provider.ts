import type { Batch, Harvester, NewBatchInput, OverharvestZone } from "./types";

export interface DataProvider {
  getBatches(filter?: { qc_status?: Batch["qc_status"] }): Promise<Batch[]>;
  getBatch(id: string): Promise<Batch | null>;
  submitBatch(input: NewBatchInput): Promise<Batch>;
  decideQC(id: string, qc_status: "pass" | "fail"): Promise<Batch>;
  getWallets(): Promise<Harvester[]>;
  getOverharvestZones(): Promise<OverharvestZone[]>;
  getCertificateUrl(id: string): string;
}
