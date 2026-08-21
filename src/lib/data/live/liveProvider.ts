import { createClient } from "@supabase/supabase-js";
import type { DataProvider } from "../provider";
import type { Batch, Harvester, NewBatchInput, OverharvestZone } from "../types";

// Prototype note: this is a hackathon integration layer, not production code.
// All values come from env vars — never hardcode keys inline in components.
const BASE_URL =
  import.meta.env["VITE_API_BASE_URL"] ?? "https://rootcode-herbtrace-api.onrender.com";

const SUPABASE_URL = import.meta.env["VITE_SUPABASE_URL"] as string;
const SUPABASE_ANON_KEY = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string;

// Supabase client — anon key only (safe client-side). No service-role key used.
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------------------------------------------------------------------------
// Generic JSON request helper
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Photo upload — Supabase Storage direct upload (does NOT go through backend)
// Bucket: harvest-photos (public, anon policies live)
// Returns the public URL to include as photo_url in POST /api/batches.
// ---------------------------------------------------------------------------
export async function supabaseUploadPhoto(file: File): Promise<string> {
  // Use a timestamp + random suffix to avoid filename collisions
  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("harvest-photos")
    .upload(filename, file, { upsert: false });

  if (error) {
    throw new Error(`Photo upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from("harvest-photos").getPublicUrl(filename);
  return data.publicUrl;
}

// ---------------------------------------------------------------------------
// Live data provider — wired to the real deployed API
// ---------------------------------------------------------------------------
export const liveProvider: DataProvider = {
  getBatches(filter) {
    const qs = filter?.qc_status
      ? `?qc_status=${encodeURIComponent(filter.qc_status)}`
      : "";
    return request<Batch[]>(`/api/batches${qs}`);
  },

  async getBatch(id) {
    // Real API uses a query param, not a path segment: GET /api/batches?id=<id>
    const res = await fetch(`${BASE_URL}/api/batches?id=${encodeURIComponent(id)}`, {
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
    // POST /api/batches — body includes quantity_kg (required, 400s if omitted)
    // Server returns the authoritative batch with real hash/prev_hash/payment fields.
    return request<Batch>("/api/batches", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  decideQC(id, qc_status) {
    // Real API: POST /api/qc with { batchId, decision, notes }
    // decision is "pass" or "fail" (same values as our qc_status)
    // notes: collection-centre UI has no notes field, pass empty string.
    return request<Batch>("/api/qc", {
      method: "POST",
      body: JSON.stringify({ batchId: id, decision: qc_status, notes: "" }),
    });
  },

  getWallets() {
    return request<Harvester[]>("/api/harvesters");
  },

  getOverharvestZones() {
    // Real endpoint is /api/overharvest-zones, not /api/zones
    return request<OverharvestZone[]>("/api/overharvest-zones");
  },

  getCertificateUrl(id) {
    // Returns a URL string — the browser opens/downloads the PDF directly.
    // Do NOT fetch this as JSON. Use window.open() or an <a href> in the UI.
    return `${BASE_URL}/api/certificate?batchId=${encodeURIComponent(id)}`;
  },
};
