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

function CollectPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Batch | null>(null);
  const [deciding, setDeciding] = useState(false);

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

  async function decide(qc: "pass" | "fail") {
    if (!selected) return;
    setDeciding(true);
    try {
      const updated = await dataProvider.decideQC(selected.id, qc);
      const freshBatches = await dataProvider.getBatches();
      setBatches(freshBatches);
      setSelected(freshBatches.find((b) => b.id === updated.id) ?? updated);
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
                      {selected.gps_lat.toFixed(4)}, {selected.gps_lon.toFixed(4)}
                    </dd>
                  </div>
                </dl>
                <div className="flex flex-wrap gap-2">
                  <HashChip label="hash" value={selected.hash} />
                  <HashChip label="prev" value={selected.prev_hash} />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button className="flex-1" disabled={deciding} onClick={() => decide("pass")}>
                    Pass QC
                  </Button>
                  <Button
                    className="flex-1"
                    variant="destructive"
                    disabled={deciding}
                    onClick={() => decide("fail")}
                  >
                    Fail QC
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
