import { Download, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ConfidenceBadge,
  HashChip,
  PaymentBadge,
  QcBadge,
} from "@/components/rootcode/StatusBadges";
import { dataProvider, type Batch, type Harvester } from "@/lib/data";

// ---------------------------------------------------------------------------
// Shared provenance timeline — used by both the public consumer/exporter view
// (/trace/:batchId, /provenance/:batchId) and the harvester's own status view
// (/harvest/status/:batchId). The only difference is showPaymentInfo.
// ---------------------------------------------------------------------------

export type ProvenanceTimelineProps = {
  batch: Batch;
  harvester?: Harvester;
  showPaymentInfo: boolean;
};

export function ProvenanceTimeline({
  batch,
  harvester: _harvester,
  showPaymentInfo,
}: ProvenanceTimelineProps) {
  function openCertificate() {
    // getCertificateUrl returns a real PDF URL — open directly in the browser.
    // No fetch, no JSON parsing — the browser handles download/display.
    const url = dataProvider.getCertificateUrl(batch.id);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
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
            onError={(e) => {
              // photo_url is a placeholder on test batches — hide the broken img
              // and show a muted fallback so the rest of the timeline still renders.
              const target = e.currentTarget;
              target.style.display = "none";
              const fallback = target.nextElementSibling as HTMLElement | null;
              if (fallback) fallback.style.display = "flex";
            }}
          />
          <div
            style={{ display: "none" }}
            className="leaf-surface aspect-video w-full items-center justify-center rounded-md border border-border"
          >
            <span className="text-sm text-muted-foreground">Photo not available</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {new Date(batch.timestamp).toLocaleString()} · harvester {batch.harvester_id}
          </p>
          {batch.quantity_kg != null && batch.quantity_kg > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              Quantity: {batch.quantity_kg} kg
            </p>
          )}
        </TimelineItem>

        <TimelineItem title="Geo-tagged origin">
          <div className="leaf-surface flex h-32 items-center justify-center rounded-md border border-border">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 text-primary" />
              {batch.gps_lat?.toFixed(4) ?? "—"}, {batch.gps_lon?.toFixed(4) ?? "—"}
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
          {batch.qc_timestamp && (
            <p className="mt-2 text-sm text-muted-foreground">
              Decided {new Date(batch.qc_timestamp).toLocaleString()}
            </p>
          )}
          {batch.qc_notes && (
            <p className="mt-1 text-sm text-muted-foreground">Notes: {batch.qc_notes}</p>
          )}
        </TimelineItem>

        <TimelineItem title="Ledger entry">
          <div className="flex flex-wrap gap-2">
            <HashChip label="hash" value={batch.hash} />
            <HashChip label="prev" value={batch.prev_hash} />
          </div>
        </TimelineItem>
      </ol>

      {/* Payment section — visible only to the harvester, never to a random QR scanner */}
      {showPaymentInfo && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-serif text-base">Payment status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex flex-wrap gap-2">
              <PaymentBadge status={batch.payment_status} />
            </div>
            {batch.payment_status === "released" && batch.payment_amount != null ? (
              <p className="text-muted-foreground">
                Amount:{" "}
                <span className="font-medium text-foreground">
                  ₹{batch.payment_amount}
                </span>{" "}
                <span className="text-xs">
                  (simulated — ₹50/kg, not real money)
                </span>
              </p>
            ) : (
              <p className="text-muted-foreground">
                Pending QC review — payment will be released once the batch passes quality
                control.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-serif text-base">Export certificate</CardTitle>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={openCertificate}>
            <Download className="size-4" /> Download certificate
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

// ---------------------------------------------------------------------------
// Internal helper — timeline list item with a dot marker
// ---------------------------------------------------------------------------
function TimelineItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="relative">
      <span className="absolute -left-[1.9rem] top-1.5 size-3 rounded-full border-2 border-background bg-primary" />
      <h2 className="font-serif text-base">{title}</h2>
      <div className="mt-2">{children}</div>
    </li>
  );
}
