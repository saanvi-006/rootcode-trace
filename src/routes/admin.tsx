import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import {
  dataProvider,
  type Batch,
  type Harvester,
  type OverharvestZone,
} from "@/lib/data";

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
      .then(([batchesData, walletsData, zonesData]) => {
        if (!active) return;
        setBatches(batchesData);
        setWallets(walletsData);
        setZones(zonesData);
      })
      .catch((e) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Failed to load dashboard data");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const harvesterMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const w of wallets) {
      map.set(w.id, w.name);
    }
    return map;
  }, [wallets]);

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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Section 1: Tamper-evident ledger */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="font-serif text-base">Tamper-evident ledger</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {loading ? (
                <SproutSpinner label="Fetching ledger batches…" />
              ) : (
                <div className="max-h-80 overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-card">
                      <TableRow>
                        <TableHead>Batch ID</TableHead>
                        <TableHead>Species</TableHead>
                        <TableHead>Hash</TableHead>
                        <TableHead>Previous hash</TableHead>
                        <TableHead>QC status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batches.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="font-mono text-xs">
                            <Link
                              to="/trace/$batchId"
                              params={{ batchId: b.id }}
                              className="text-primary underline-offset-4 hover:underline"
                            >
                              {b.id.slice(0, 8)}…
                            </Link>
                          </TableCell>
                          <TableCell className="font-medium">{b.species_claimed}</TableCell>
                          <TableCell>
                            <HashChip label="hash" value={b.hash} />
                          </TableCell>
                          <TableCell>
                            <HashChip label="prev" value={b.prev_hash} />
                          </TableCell>
                          <TableCell>
                            <QcBadge status={b.qc_status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 2: Payment tracker */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="font-serif text-base">Payment tracker</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {loading ? (
                <SproutSpinner label="Fetching payments…" />
              ) : (
                <div className="max-h-80 overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-card">
                      <TableRow>
                        <TableHead>Batch / species</TableHead>
                        <TableHead>Harvester</TableHead>
                        <TableHead>Payment status</TableHead>
                        <TableHead>Payment amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batches.map((b) => {
                        const harvesterName = harvesterMap.get(b.harvester_id);
                        return (
                          <TableRow key={b.id}>
                            <TableCell className="font-medium">
                              <div>{b.species_claimed}</div>
                              <span className="font-mono text-xs text-muted-foreground">
                                {b.id.slice(0, 8)}…
                              </span>
                            </TableCell>
                            <TableCell>
                              {harvesterName ? (
                                <div>
                                  <span className="font-medium">{harvesterName}</span>
                                  <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                                    ({b.harvester_id})
                                  </span>
                                </div>
                              ) : (
                                <span className="font-mono text-xs">{b.harvester_id}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <PaymentBadge status={b.payment_status} />
                            </TableCell>
                            <TableCell className="font-medium">
                              {b.payment_status === "released" ? "₹500" : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 3: Harvester wallets */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="font-serif text-base">Harvester wallets</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {loading ? (
                <SproutSpinner label="Fetching harvester wallets…" />
              ) : (
                <div className="max-h-80 overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-card">
                      <TableRow>
                        <TableHead>Harvester ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Wallet balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wallets.map((w) => (
                        <TableRow key={w.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {w.id}
                          </TableCell>
                          <TableCell className="font-medium">{w.name}</TableCell>
                          <TableCell className="text-right font-mono font-medium text-earth">
                            ₹{w.wallet_balance.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 4: Overharvest risk */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="font-serif text-base">
                Overharvest risk · Illustrative Sample Data
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {loading ? (
                <SproutSpinner label="Fetching overharvest zones…" />
              ) : (
                <div className="max-h-80 overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-card">
                      <TableRow>
                        <TableHead>Region</TableHead>
                        <TableHead>Coordinates</TableHead>
                        <TableHead>Depletion score</TableHead>
                        <TableHead className="text-right">Risk level</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {zones.map((z) => {
                        const scorePct = Math.round(z.depletion_score * 100);
                        const isHigh = z.depletion_score >= 0.7;
                        const isMedium = z.depletion_score >= 0.4;
                        return (
                          <TableRow key={z.id}>
                            <TableCell className="font-medium">{z.region}</TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {z.lat.toFixed(4)}, {z.lon.toFixed(4)}
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-sm">
                                {z.depletion_score.toFixed(2)}
                              </span>{" "}
                              <span className="text-xs text-muted-foreground">({scorePct}%)</span>
                            </TableCell>
                            <TableCell className="text-right">
                              {isHigh ? (
                                <Badge variant="destructive">High Risk</Badge>
                              ) : isMedium ? (
                                <Badge className="border-transparent bg-warning text-warning-foreground">
                                  Moderate Risk
                                </Badge>
                              ) : (
                                <Badge className="border-transparent bg-success text-success-foreground">
                                  Low Risk
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}