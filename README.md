# RootCode Trace

Lovable Build Prompt — RootCode Prototype

Build a React + Vite + TypeScript + Tailwind + shadcn/ui prototype called RootCode — an Ayurvedic herb traceability platform. This is a 2-day hackathon prototype: keep it lightweight, no backend calls yet, all data from a mock layer designed to be swapped for a real API later. Use React Router for navigation.

Design Direction (Ayurveda, premium — not devotional, not generic SaaS)

Colors: deep forest green (primary), warm turmeric/saffron (accent), earthy brown (details), parchment/off-white (background). No neon, no default SaaS blue, no heavy gradients.

Type: warm serif/humanist for headings, clean sans-serif for body/UI.

Motifs: subtle leaf/sprout/root line-art accents only — no big illustrations. A small sprout icon can act as the brand mark and a loading spinner.

Keep every screen clean and uncluttered. Use shadcn components (Card, Badge, Table, Button, Sheet, Dialog) as the base — don't hand-roll primitives.

Pages (React Router)

/ — Homepage: hero with brand name + one-line pitch, 4 pillar cards (AI Species Verification, Tamper-Evident Ledger, Overharvest Monitoring, Export Certificate), buttons linking to the 4 flows below.

/harvest — Harvester flow: photo upload (file input, preview), GPS capture (browser geolocation, show lat/lon), mock AI species result card (species + confidence %), confirm button, submit → adds batch to mock store.

/collect — Collection Center: table/list of pending batches from mock store, click a batch → detail panel with pass/fail buttons → updates qc_status and payment_status in mock store.

/trace/:batchId — Consumer/Exporter provenance page: timeline showing photo, GPS pin (simple static map placeholder or Leaflet if quick), species claimed vs AI-verified, confidence badge, QC result, hash + prev_hash chips, "Download Certificate" button (can be a stub/toast for now).

/admin — Dashboard: ledger table (batch id, hash, prev_hash), payment tracker table, harvester wallet balances list, and a simple overharvest risk section (static list or basic Leaflet markers) clearly labeled "Illustrative Sample Data".

Mock Data — Must Be Easily Replaceable

Create this exact folder structure so backend integration later is a drop-in swap:

/src/lib/data/
  types.ts          -> Batch, Harvester, OverharvestZone types (exact shape below — locked with backend team)
  provider.ts        -> DataProvider interface (getBatches, getBatch, submitBatch, decideQC, getWallets, getOverharvestZones, getCertificateUrl)
  mock/mockData.ts   -> 5-6 sample batches (varied qc_status/payment_status), 3 harvesters, 3 zones
  mock/mockProvider.ts -> implements provider.ts, mutates an in-memory store so submit/QC actions persist during the session
  live/liveProvider.ts -> implements provider.ts against the real API (build the file now, leave it unused/commented in index.ts until the base URL is confirmed)
  index.ts           -> exports `dataProvider`, currently = mockProvider (swap to liveProvider by flipping one line)


All pages must call dataProvider.xxx() only — never import mock data directly in components. Use simple useEffect + useState hooks (no extra state library needed).

Locked field shapes (must match exactly — do not rename/reshape)

interface Batch {
  id: string;                  // UUID
  species_claimed: string;
  species_ai_result: string;
  confidence_score: number;    // 0–1 decimal, e.g. 0.87
  gps_lat: number;
  gps_lon: number;
  harvester_id: string;
  photo_url: string;
  timestamp: string;           // ISO 8601, e.g. "2026-08-20T14:32:00Z"
  qc_status: "pending" | "pass" | "fail";
  prev_hash: string | null;
  hash: string;
  payment_status: "pending" | "released";
}
interface Harvester { id: string; name: string; wallet_balance: number; }
interface OverharvestZone { id: string; region: string; depletion_score: number; lat: number; lon: number; }


liveProvider.ts — build against these exact endpoints

Base URL comes from VITE_API_BASE_URL (Vite env var, placeholder http://localhost:3000 for now — will be swapped to a deployed Vercel URL, this is a known pending step, not an error).

Method Path GET /api/batches?qc_status= GET /api/batches/:id POST /api/batches PATCH /api/batches/:id/qc (body {qc_status: "pass"|"fail"}) GET /api/harvesters GET /api/zones GET /api/batches/:id/certificate (returns PDF directly)

Errors return { error: string } with standard 400/404/500 status codes — handle with a try/catch that surfaces error in the UI's error state.

Photo upload: the POST /api/batches body expects photo_url as a plain string (a pre-uploaded Supabase Storage public URL) — the backend does not accept raw image bytes. For now, mock this with a placeholder URL or local object URL; leave a clear // TODO: replace with real Supabase upload once bucket/anon key received comment in the harvester submit handler.

Keep It Light

No auth, no real backend, no complex animations.

Simple loading states (skeleton or spinner) on data calls since mock functions should simulate a short delay.

Mobile-first only for /harvest and /trace/:batchId; /collect and /admin just need to be responsive.

Skip NDVI/map complexity if it risks scope — a static styled list of zones with a risk badge is fine instead of a full Leaflet map.

Build the design system and Homepage first, then the 4 screens in order: Harvester → Collect → Trace → Admin.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6b45b0c4-d528-4149-8549-bd4003ea8c23).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
