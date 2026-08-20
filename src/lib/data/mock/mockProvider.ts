import type { DataProvider } from "../provider";
import type { Batch, Harvester, NewBatchInput, OverharvestZone } from "../types";
import { mockBatches, mockHarvesters, mockZones } from "./mockData";

// Persisted store (localStorage) so submit / QC actions survive refresh and revisits,
// not just while the tab stays open.
const STORAGE_KEY = "rootcode_mock_batches";
const WALLET_KEY = "rootcode_mock_wallets";

function loadBatches(): Batch[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Batch[]) : [...mockBatches];
  } catch {
    return [...mockBatches];
  }
}

function saveBatches(data: Batch[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadWallets(): Harvester[] {
  try {
    const saved = localStorage.getItem(WALLET_KEY);
    return saved ? (JSON.parse(saved) as Harvester[]) : mockHarvesters.map((h) => ({ ...h }));
  } catch {
    return mockHarvesters.map((h) => ({ ...h }));
  }
}

function saveWallets(data: Harvester[]) {
  localStorage.setItem(WALLET_KEY, JSON.stringify(data));
}

const batches: Batch[] = loadBatches();
const harvesters: Harvester[] = loadWallets();
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
    saveBatches(batches);
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
    saveBatches(batches);
    saveWallets(harvesters);
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