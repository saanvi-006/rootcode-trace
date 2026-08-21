import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SiteHeader } from "@/components/rootcode/SiteHeader";
import { SproutSpinner } from "@/components/rootcode/Sprout";
import {
  ConfidenceBadge,
  HashChip,
  PaymentBadge,
  QcBadge,
} from "@/components/rootcode/StatusBadges";
import { QRCode } from "@/components/rootcode/QRCode";
import { dataProvider, type Batch } from "@/lib/data";

export const Route = createFileRoute("/collect")({
  head: () => ({
    meta: [
      { title: "Collection Centre — RootCode" },
      {
        name: "description",
        content:
          "Review incoming herb batches, run quality control and release harvester payments from the RootCode collection centre.",
      },
      { property: "og:title", content: "Collection Centre — RootCode" },
      {
        property: "og:description",
        content: "Pass or fail incoming Ayurvedic herb batches and release payments.",
      },
    ],
  }),
  component: CollectPage,
});

const API_BASE_URL =
  import.meta.env["VITE_API_BASE_URL"] ?? "https://rootcode-herbtrace-api.onrender.com";

function CollectPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Batch | null>(null);
  const [deciding, setDeciding] = useState(false);
  const [qrData, setQrData] = useState<{
    qr_data_url: string;
    provenance_url?: string;
  } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    dataProvider
      .getBatches()
      .then((data) => active && setBatches(data))
      .catch((e) => active && setError(e instanceof Error ? e.message : "Failed to load batches"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selected || selected.qc_status !== "pass") {
      setQrData(null);
      setQrLoading(false);
      setQrError(null);
      return;
    }

    let active = true;
    setQrLoading(true);
    setQrError(null);
    setQrData(null);

    const url = `${API_BASE_URL}/api/qr?batchId=${encodeURIComponent(selected.id)}`;
    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load QR code (${res.status})`);
        }
        return (await res.json()) as {
          qr?: string;
          qr_data_url?: string;
          provenance_url?: string;
          batch_id?: string;
        };
      })
      .then((data) => {
        if (!active) return;
        const qrUrl = data.qr_data_url || data.qr;
        if (qrUrl) {
          setQrData({
            qr_data_url: qrUrl,
            provenance_url: data.provenance_url,
          });
        } else {
          setQrError("No QR image data returned");
        }
      })
      .catch((e) => {
        if (!active) return;
        setQrError(e instanceof Error ? e.message : "Failed to load QR code");
      })
      .finally(() => {
        if (active) setQrLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selected?.id, selected?.qc_status]);

  async function decide(qc: "pass" | "fail") {
    if (!selected) return;
    setDeciding(true);
    try {
      const updated = await dataProvider.decideQC(selected.id, qc);
      const freshBatches = await dataProvider.getBatches();
      setBatches(freshBatches);
      const targetId = updated?.id ?? selected.id;
      const fresh = freshBatches.find((b) => b.id === targetId);
      if (fresh) {
        setSelected(fresh);
      } else if (updated && updated.id && updated.species_claimed) {
        setSelected(updated);
      } else {
        setSelected({
          ...selected,
          qc_status: qc,
          payment_status: qc === "pass" ? "released" : "pending",
        });
      }
      toast.success(qc === "pass" ? "Batch passed — payment released" : "Batch marked failed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "QC update failed");
    } finally {
      setDeciding(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl">Collection centre</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Incoming batches awaiting quality control. Select a row to review and decide.
        </p>

        {error && (
          <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-serif text-base">Batch queue</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <SproutSpinner label="Fetching batches…" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Species claimed</TableHead>
                      <TableHead>AI result</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>QC</TableHead>
                      <TableHead>Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((b) => (
                      <TableRow
                        key={b.id}
                        className="cursor-pointer"
                        onClick={() => setSelected(b)}
                      >
                        <TableCell className="font-medium">{b.species_claimed}</TableCell>
                        <TableCell className="italic text-muted-foreground">
                          {b.species_ai_result}
                        </TableCell>
                        <TableCell>
                          <ConfidenceBadge score={b.confidence_score} />
                        </TableCell>
                        <TableCell>
                          <QcBadge status={b.qc_status} />
                        </TableCell>
                        <TableCell>
                          <PaymentBadge status={b.payment_status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-serif">{selected.species_claimed}</SheetTitle>
                <SheetDescription>
                  Harvested {new Date(selected.timestamp).toLocaleString()} by{" "}
                  {selected.harvester_id}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                <img
                  src={selected.photo_url}
                  alt={selected.species_claimed}
                  className="aspect-video w-full rounded-md border border-border object-cover"
                />
                <div className="flex flex-wrap gap-2">
                  <ConfidenceBadge score={selected.confidence_score} />
                  <QcBadge status={selected.qc_status} />
                  <PaymentBadge status={selected.payment_status} />
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">AI species</dt>
                    <dd className="italic">{selected.species_ai_result}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">GPS</dt>
                    <dd>
                      {selected.gps_lat?.toFixed(4) ?? "—"},{" "}
                      {selected.gps_lon?.toFixed(4) ?? "—"}
                    </dd>
                  </div>
                </dl>
                <div className="flex flex-wrap gap-2">
                  <HashChip label="hash" value={selected.hash} />
                  <HashChip label="prev" value={selected.prev_hash} />
                </div>

                {/* QR Code Section for Passed Batches */}
                {selected.qc_status === "pass" && (
                  <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-sm font-medium">Provenance QR code</h3>
                      <span className="text-xs text-muted-foreground">Scan to verify</span>
                    </div>
                    <div className="flex flex-col items-center gap-2.5">
                      <QRCode
                        value={
                          typeof window !== "undefined"
                            ? `${window.location.origin}/provenance/${selected.id}`
                            : `https://rootcode-trace.vercel.app/provenance/${selected.id}`
                        }
                        size={160}
                      />
                      <a
                        href={`/provenance/${selected.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[11px] text-primary underline-offset-4 hover:underline break-all text-center"
                      >
                        {typeof window !== "undefined"
                          ? `${window.location.origin}/provenance/${selected.id}`
                          : `https://rootcode-trace.vercel.app/provenance/${selected.id}`}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1"
                    variant={selected.qc_status === "pass" ? "outline" : "default"}
                    disabled={deciding || selected.qc_status === "pass"}
                    onClick={() => decide("pass")}
                  >
                    {selected.qc_status === "pass" ? "✓ QC Passed" : "Pass QC"}
                  </Button>
                  <Button
                    className="flex-1"
                    variant={selected.qc_status === "fail" ? "outline" : "destructive"}
                    disabled={deciding || selected.qc_status === "fail"}
                    onClick={() => decide("fail")}
                  >
                    {selected.qc_status === "fail" ? "✕ QC Failed" : "Fail QC"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
