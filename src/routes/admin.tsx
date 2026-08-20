import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { HashChip, PaymentBadge, QcBadge } from "@/components/rootcode/StatusBadges";
import { dataProvider, type Batch, type Harvester, type OverharvestZone } from "@/lib/data";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Ledger Dashboard — RootCode" },
      {
        name: "description",
        content:
          "RootCode admin dashboard: hash-chained batch ledger, payment tracker, harvester wallets and overharvest risk zones.",
      },
      { property: "og:title", content: "Ledger Dashboard — RootCode" },
      {
        property: "og:description",
        content: "Ledger, payments, wallets and overharvest risk in one view.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [wallets, setWallets] = useState<Harvester[]>([]);
  const [zones, setZones] = useState<OverharvestZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      dataProvider.getBatches(),
      dataProvider.getWallets(),
      dataProvider.getOverharvestZones(),
    ])
      .then(([b, w, z]) => {
        if (!active) return;
        setBatches(b);
        setWallets(w);
        setZones(z);
      })
      .catch((e) => active && setError(e instanceof Error ? e.message : "Failed to load dashboard"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Illustrative Sample Data — prototype ledger, not production records.
          </p>
        </div>

        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {loading ? (
          <SproutSpinner label="Loading dashboard…" />
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-base">Tamper-evident ledger</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch</TableHead>
                      <TableHead>Hash</TableHead>
                      <TableHead>Prev hash</TableHead>
                      <TableHead>QC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <Link
                            to="/trace/$batchId"
                            params={{ batchId: b.id }}
                            className="text-primary underline-offset-4 hover:underline"
                          >
                            {b.id.slice(0, 8)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <HashChip label="" value={b.hash} />
                        </TableCell>
                        <TableCell>
                          <HashChip label="" value={b.prev_hash} />
                        </TableCell>
                        <TableCell>
                          <QcBadge status={b.qc_status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-base">Payment tracker</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch</TableHead>
                        <TableHead>Harvester</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batches.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell>{b.id.slice(0, 8)}</TableCell>
                          <TableCell>{b.harvester_id}</TableCell>
                          <TableCell>
                            <PaymentBadge status={b.payment_status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-base">Harvester wallets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {wallets.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{h.name}</p>
                        <p className="text-xs text-muted-foreground">{h.id}</p>
                      </div>
                      <p className="font-serif text-lg">₹{h.wallet_balance.toLocaleString()}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-base">
                  Overharvest risk · Illustrative Sample Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {zones.map((z) => {
                  const high = z.depletion_score >= 0.7;
                  const medium = z.depletion_score >= 0.4 && !high;
                  return (
                    <div
                      key={z.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{z.region}</p>
                        <p className="text-xs text-muted-foreground">
                          {z.lat.toFixed(3)}, {z.lon.toFixed(3)}
                        </p>
                      </div>
                      <Badge
                        className={
                          high
                            ? "border-transparent bg-destructive text-destructive-foreground"
                            : medium
                              ? "border-transparent bg-warning text-warning-foreground"
                              : "border-transparent bg-success text-success-foreground"
                        }
                      >
                        {high ? "High" : medium ? "Moderate" : "Low"} ·{" "}
                        {Math.round(z.depletion_score * 100)}%
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
