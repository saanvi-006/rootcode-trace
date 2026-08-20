import type { DataProvider } from "../provider";
import type { Batch, Harvester, NewBatchInput, OverharvestZone } from "../types";
import { mockBatches, mockHarvesters, mockZones } from "./mockData";

// In-memory session store so submit / QC actions persist while the tab is open.
const batches: Batch[] = [...mockBatches];
const harvesters: Harvester[] = mockHarvesters.map((h) => ({ ...h }));
const zones: OverharvestZone[] = mockZones.map((z) => ({ ...z }));

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));

const randomHash = () =>
  "0x" +
  Array.from({ length: 12 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");

export const mockProvider: DataProvider = {
  async getBatches(filter) {
    await delay();
    const list = filter?.qc_status
      ? batches.filter((b) => b.qc_status === filter.qc_status)
      : batches;
    return list.map((b) => ({ ...b })).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  },

  async getBatch(id) {
    await delay(400);
    const found = batches.find((b) => b.id === id);
    return found ? { ...found } : null;
  },

  async submitBatch(input: NewBatchInput) {
    await delay(700);
    const prev = batches[batches.length - 1];
    const batch: Batch = {
      ...input,
      id: crypto.randomUUID(),
      qc_status: "pending",
      payment_status: "pending",
      prev_hash: prev ? prev.hash : null,
      hash: randomHash(),
    };
    batches.push(batch);
    return { ...batch };
  },

  async decideQC(id, qc_status) {
    await delay(500);
    const batch = batches.find((b) => b.id === id);
    if (!batch) throw new Error("Batch not found");
    batch.qc_status = qc_status;
    batch.payment_status = qc_status === "pass" ? "released" : "pending";
    if (qc_status === "pass") {
      const harvester = harvesters.find((h) => h.id === batch.harvester_id);
      if (harvester) harvester.wallet_balance += 500;
    }
    return { ...batch };
  },

  async getWallets() {
    await delay(400);
    return harvesters.map((h) => ({ ...h }));
  },

  async getOverharvestZones() {
    await delay(400);
    return zones.map((z) => ({ ...z }));
  },

  getCertificateUrl(id) {
    return `#certificate-${id}`;
  },
};
