import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Camera, MapPin, CheckCircle2, User, Scale } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/rootcode/SiteHeader";
import { ConfidenceBadge } from "@/components/rootcode/StatusBadges";
import { dataProvider } from "@/lib/data";
import { supabaseUploadPhoto } from "@/lib/data/live/liveProvider";
import { predictSpecies } from "@/lib/species-classifier";

export const Route = createFileRoute("/harvest")({
  head: () => ({
    meta: [
      { title: "Log a Harvest — RootCode" },
      {
        name: "description",
        content:
          "Capture a herb harvest: photo, GPS coordinates and AI species verification, submitted straight to the RootCode ledger.",
      },
      { property: "og:title", content: "Log a Harvest — RootCode" },
      {
        property: "og:description",
        content: "Photo, GPS and AI species verification for each Ayurvedic herb batch.",
      },
    ],
  }),
  component: HarvestPage,
});

// ---------------------------------------------------------------------------
// Hardcoded harvester list — do NOT replace with a live API call.
// The live /api/harvesters mixes in test rows that shouldn't appear during demo.
// ---------------------------------------------------------------------------
const HARVESTERS = [
  { id: "11111111-1111-1111-1111-111111111111", name: "Rajeshwar Gond (Sehore Belt)" },
  { id: "22222222-2222-2222-2222-222222222222", name: "Sunita Devi (Chamoli Hills)" },
  { id: "33333333-3333-3333-3333-333333333333", name: "Muthu Vel (Nilgiri Reserve)" },
  { id: "44444444-4444-4444-4444-444444444444", name: "Anand Verma (Satpura Foothills)" },
] as const;

// Species names — must match exactly (case-sensitive) what the backend accepts.
// These are also the labels the AI classifier returns, so claimed vs. AI result can be compared.
const SPECIES_OPTIONS = [
  "Ashwagandha",
  "Brahmi",
  "Tulsi",
  "Neem",
  "Lookalike (non-medicinal)",
] as const;

// Mirror of the SPECIES_MAPPING in species-classifier.ts.
// The classifier returns the scientific name (e.g. "Ocimum tenuiflorum (Tulsi)"),
// so to detect a genuine mismatch we must compare against the mapped form of
// whatever the harvester claimed — not the raw common name.
const SPECIES_TO_SCIENTIFIC: Record<string, string> = {
  "Ashwagandha": "Withania somnifera (Ashwagandha)",
  "Brahmi": "Bacopa monnieri (Brahmi)",
  "Tulsi": "Ocimum tenuiflorum (Tulsi)",
  "Neem": "Azadirachta indica (Neem)",
  "Lookalike (non-medicinal)": "Unverified / Lookalike (Reject)",
};

function HarvestPage() {
  const navigate = useNavigate();

  // Form state
  const [harvesterId, setHarvesterId] = useState<string>(HARVESTERS[0].id);
  const [speciesClaimed, setSpeciesClaimed] = useState<string>(SPECIES_OPTIONS[0]);
  const [quantityKg, setQuantityKg] = useState<string>("");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Photo state — keep the File object for Supabase upload
  const imageRef = useRef<HTMLImageElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // AI state
  const [aiResult, setAiResult] = useState<{ name: string; score: number } | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // UI state
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // AI species prediction
  // ---------------------------------------------------------------------------
  async function runPrediction() {
    if (!imageRef.current) return;
    setIsPredicting(true);
    setConfirmed(false);
    try {
      const result = await predictSpecies(imageRef.current, speciesClaimed);
      setAiResult(result);
    } catch {
      setError("AI verification failed. Check model files.");
    } finally {
      setIsPredicting(false);
    }
  }

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
    setConfirmed(false);
    setAiResult(null);
  }

  // ---------------------------------------------------------------------------
  // GPS capture
  // ---------------------------------------------------------------------------
  function captureGps() {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not available on this device.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("Could not read GPS. Enable location access and retry.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  async function submit() {
    if (!aiResult || !coords || !photoFile || !quantityKg) return;
    const qty = parseFloat(quantityKg);
    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid harvest quantity.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. Upload photo to Supabase Storage — get real public URL
      const photoUrl = await supabaseUploadPhoto(photoFile);

      // 2. POST batch to API — server returns authoritative object with real hash/prev_hash
      const batch = await dataProvider.submitBatch({
        species_claimed: speciesClaimed,
        species_ai_result: aiResult.name,
        confidence_score: aiResult.score,
        gps_lat: coords.lat,
        gps_lon: coords.lon,
        harvester_id: harvesterId,
        photo_url: photoUrl,
        quantity_kg: qty,
        timestamp: new Date().toISOString(),
      });

      toast.success("Batch submitted to the ledger");

      // Navigate to the harvester's own status view (shows payment info)
      navigate({ to: "/harvest-status/$batchId", params: { batchId: batch.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  const speciesMismatch =
    aiResult !== null &&
    aiResult.name !== (SPECIES_TO_SCIENTIFIC[speciesClaimed] ?? speciesClaimed);
  const qty = parseFloat(quantityKg);
  const canSubmit =
    confirmed &&
    !!coords &&
    !!photoFile &&
    !isNaN(qty) &&
    qty > 0 &&
    !!harvesterId &&
    !submitting;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-lg px-4 py-8">
        <h1 className="text-2xl">Log a harvest</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Three steps in the field: photo, location, species confirmation.
        </p>

        {error && (
          <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {/* ── 0 · Harvester identity ────────────────────────────────────── */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <User className="size-4 text-primary" /> Who are you?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Label htmlFor="harvester">Select your name</Label>
            <select
              id="harvester"
              value={harvesterId}
              onChange={(e) => setHarvesterId(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {HARVESTERS.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* ── 1 · Harvest photo ─────────────────────────────────────────── */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <Camera className="size-4 text-primary" /> 1 · Harvest photo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input type="file" accept="image/*" capture="environment" onChange={onPhoto} />
            {photoPreview && (
              <img
                ref={imageRef}
                src={photoPreview}
                alt="Harvested herb sample"
                onLoad={runPrediction}
                crossOrigin="anonymous"
                className="aspect-video w-full rounded-md border border-border object-cover"
              />
            )}
          </CardContent>
        </Card>

        {/* ── 2 · GPS origin ────────────────────────────────────────────── */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <MapPin className="size-4 text-primary" /> 2 · GPS origin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={captureGps}
              disabled={locating}
            >
              {locating ? "Reading location…" : "Capture GPS"}
            </Button>
            {coords && (
              <p className="hash-chip inline-block">
                {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── 3 · Species verification ──────────────────────────────────── */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="font-serif text-base">3 · Species verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Species claimed — harvester's own manual choice, independent of AI */}
            <div className="space-y-1.5">
              <Label htmlFor="species">Species claimed (your choice)</Label>
              <select
                id="species"
                value={speciesClaimed}
                onChange={(e) => {
                  setSpeciesClaimed(e.target.value);
                  setConfirmed(false);
                  if (photoPreview) runPrediction();
                }}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {SPECIES_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* AI result — read-only, displayed separately so mismatch is visible */}
            {isPredicting ? (
              <p className="text-sm text-primary animate-pulse">Running AI verification...</p>
            ) : aiResult ? (
              <div className="rounded-lg border border-border bg-secondary/50 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  AI species result (read-only)
                </p>
                <p className="mt-1 font-serif text-lg italic">{aiResult.name}</p>
                <div className="mt-2">
                  <ConfidenceBadge score={aiResult.score} />
                </div>
                {speciesMismatch && (
                  <p className="mt-3 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
                    ⚠ Species mismatch — AI detected a different plant than what you
                    claimed. The collection centre will review this discrepancy.
                  </p>
                )}
                <Button
                  className="mt-4 w-full"
                  variant={confirmed ? "secondary" : "default"}
                  onClick={() => setConfirmed(true)}
                >
                  {confirmed ? (
                    <>
                      <CheckCircle2 className="size-4" /> Confirmed
                    </>
                  ) : (
                    "Confirm and proceed"
                  )}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Upload a photo to run species verification.
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── 4 · Harvest quantity ──────────────────────────────────────── */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <Scale className="size-4 text-primary" /> 4 · Harvest quantity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Label htmlFor="quantity">Quantity (kg)</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="0.1"
              placeholder="e.g. 12.5"
              value={quantityKg}
              onChange={(e) => setQuantityKg(e.target.value)}
            />
          </CardContent>
        </Card>

        <Button
          className="mt-6 w-full"
          size="lg"
          disabled={!canSubmit}
          onClick={submit}
        >
          {submitting ? "Submitting…" : "Submit batch"}
        </Button>
      </main>
    </div>
  );
}