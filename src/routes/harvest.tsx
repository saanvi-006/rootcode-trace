import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, MapPin, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/rootcode/SiteHeader";
import { ConfidenceBadge } from "@/components/rootcode/StatusBadges";
import { dataProvider } from "@/lib/data";

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

const SPECIES = [
  "Withania somnifera (Ashwagandha)",
  "Bacopa monnieri (Brahmi)",
  "Curcuma longa (Turmeric)",
  "Ocimum tenuiflorum (Tulsi)",
  "Asparagus racemosus (Shatavari)",
];

function HarvestPage() {
  const navigate = useNavigate();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [species, setSpecies] = useState<string>(SPECIES[0] ?? "");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [aiResult, setAiResult] = useState<{ name: string; score: number } | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
    setConfirmed(false);
    // Mock AI inference on the uploaded photo.
    setAiResult({
      name: species.replace(/\s*\(.*\)$/, ""),
      score: Number((0.72 + Math.random() * 0.26).toFixed(2)),
    });
  }

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

  async function submit() {
    if (!aiResult || !coords) return;
    setSubmitting(true);
    setError(null);
    try {
      const batch = await dataProvider.submitBatch({
        species_claimed: species,
        species_ai_result: aiResult.name,
        confidence_score: aiResult.score,
        gps_lat: coords.lat,
        gps_lon: coords.lon,
        harvester_id: "h-001",
        // TODO: replace with real Supabase upload once bucket/anon key received
        photo_url: photoPreview ?? "https://placehold.co/800x600?text=Herb+photo",
        timestamp: new Date().toISOString(),
      });
      toast.success("Batch submitted to the ledger");
      navigate({ to: "/trace/$batchId", params: { batchId: batch.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

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

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <Camera className="size-4 text-primary" /> 1 · Harvest photo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input type="file" accept="image/*" capture="environment" onChange={onPhoto} />
            {photoPreview && (
              <img
                src={photoPreview}
                alt="Harvested herb sample"
                className="aspect-video w-full rounded-md border border-border object-cover"
              />
            )}
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-base">
              <MapPin className="size-4 text-primary" /> 2 · GPS origin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full" onClick={captureGps} disabled={locating}>
              {locating ? "Reading location…" : "Capture GPS"}
            </Button>
            {coords && (
              <p className="hash-chip inline-block">
                {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="font-serif text-base">3 · Species verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="species">Species claimed</Label>
              <select
                id="species"
                value={species}
                onChange={(e) => {
                  const value = e.target.value;
                  setSpecies(value);
                  setConfirmed(false);
                  if (photoPreview) {
                    setAiResult({
                    name: value.replace(/\s*\(.*\)$/, ""),
                  score: Number((0.72 + Math.random() * 0.26).toFixed(2)),
                  });
                }
              }}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {SPECIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {aiResult ? (
              <div className="rounded-lg border border-border bg-secondary/50 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  AI species result
                </p>
                <p className="mt-1 font-serif text-lg italic">{aiResult.name}</p>
                <div className="mt-2">
                  <ConfidenceBadge score={aiResult.score} />
                </div>
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
                    "Confirm match"
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

        <Button
          className="mt-6 w-full"
          size="lg"
          disabled={!confirmed || !coords || submitting}
          onClick={submit}
        >
          {submitting ? "Submitting…" : "Submit batch"}
        </Button>
      </main>
    </div>
  );
}
