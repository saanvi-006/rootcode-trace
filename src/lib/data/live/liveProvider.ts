import type { DataProvider } from "../provider";
import type { Batch, Harvester, NewBatchInput, OverharvestZone } from "../types";

// TODO: swap placeholder for the deployed API base URL once confirmed.
const BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "http://localhost:3000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // non-JSON error body — keep the generic message
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}

export const liveProvider: DataProvider = {
  getBatches(filter) {
    const qs = filter?.qc_status ? `?qc_status=${encodeURIComponent(filter.qc_status)}` : "";
    return request<Batch[]>(`/api/batches${qs}`);
  },

  async getBatch(id) {
    const res = await fetch(`${BASE_URL}/api/batches/${id}`, {
      headers: { "Content-Type": "application/json" },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      try {
        const body = (await res.json()) as { error?: string };
        if (body?.error) message = body.error;
      } catch {}
      throw new Error(message);
    }
    return (await res.json()) as Batch;
  },

  submitBatch(input: NewBatchInput) {
    return request<Batch>("/api/batches", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  decideQC(id, qc_status) {
    return request<Batch>(`/api/batches/${id}/qc`, {
      method: "PATCH",
      body: JSON.stringify({ qc_status }),
    });
  },

  getWallets() {
    return request<Harvester[]>("/api/harvesters");
  },

  getOverharvestZones() {
    return request<OverharvestZone[]>("/api/zones");
  },

  getCertificateUrl(id) {
    // Endpoint returns a PDF directly.
    return `${BASE_URL}/api/batches/${id}/certificate`;
  },
};
