import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/rootcode/SiteHeader";
import { SproutSpinner } from "@/components/rootcode/Sprout";
import {
  ConfidenceBadge,
  HashChip,
  PaymentBadge,
  QcBadge,
} from "@/components/rootcode/StatusBadges";
import { dataProvider, type Batch } from "@/lib/data";

export const Route = createFileRoute("/trace/$batchId")({
  head: () => ({
    meta: [
      { title: "Batch Provenance — RootCode" },
      {
        name: "description",
        content:
          "Full provenance for an Ayurvedic herb batch: harvest photo, GPS origin, AI species verification, QC verdict and ledger hashes.",
      },
      { property: "og:title", content: "Batch Provenance — RootCode" },
      {
        property: "og:description",
        content: "Trace an Ayurvedic herb batch from soil to shelf.",
      },
    ],
  }),
  component: TracePage,
});

function TracePage() {
  const { batchId } = Route.useParams();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    dataProvider
      .getBatch(batchId)
      .then((b) => active && setBatch(b))
      .catch((e) => active && setError(e instanceof Error ? e.message : "Batch not found"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [batchId]);

  async function downloadCertificate() {
    try {
      await dataProvider.getCertificateUrl(batchId);
      toast.success("Certificate generated (stub) — PDF export lands with the live API.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Certificate unavailable");
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        {loading && <SproutSpinner label="Tracing batch…" />}

        {error && !loading && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {batch && !loading && (
          <>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Provenance</p>
            <h1 className="mt-1 text-2xl">{batch.species_claimed}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <ConfidenceBadge score={batch.confidence_score} />
              <QcBadge status={batch.qc_status} />
              <PaymentBadge status={batch.payment_status} />
            </div>

            <ol className="mt-8 space-y-6 border-l border-border pl-6">
              <TimelineItem title="Harvested in the field">
                <img
                  src={batch.photo_url}
                  alt={`${batch.species_claimed} at harvest`}
                  className="aspect-video w-full rounded-md border border-border object-cover"
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  {new Date(batch.timestamp).toLocaleString()} · harvester {batch.harvester_id}
                </p>
              </TimelineItem>

              <TimelineItem title="Geo-tagged origin">
                <div className="leaf-surface flex h-32 items-center justify-center rounded-md border border-border">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4 text-primary" />
                    {batch.gps_lat.toFixed(4)}, {batch.gps_lon.toFixed(4)}
                  </span>
                </div>
              </TimelineItem>

              <TimelineItem title="Species verification">
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Claimed</dt>
                    <dd>{batch.species_claimed}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">AI verified</dt>
                    <dd className="italic">{batch.species_ai_result}</dd>
                  </div>
                </dl>
              </TimelineItem>

              <TimelineItem title="Quality control">
                <QcBadge status={batch.qc_status} />
              </TimelineItem>

              <TimelineItem title="Ledger entry">
                <div className="flex flex-wrap gap-2">
                  <HashChip label="hash" value={batch.hash} />
                  <HashChip label="prev" value={batch.prev_hash} />
                </div>
              </TimelineItem>
            </ol>

            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="font-serif text-base">Export certificate</CardTitle>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={downloadCertificate}>
                  <Download className="size-4" /> Download certificate
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

function TimelineItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="relative">
      <span className="absolute -left-[1.9rem] top-1.5 size-3 rounded-full border-2 border-background bg-primary" />
      <h2 className="font-serif text-base">{title}</h2>
      <div className="mt-2">{children}</div>
    </li>
  );
}
