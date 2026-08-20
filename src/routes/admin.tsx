import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/rootcode/SiteHeader";

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

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-base">Tamper-evident ledger</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon.</p>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-base">Payment tracker</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Coming soon.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-base">Harvester wallets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Coming soon.</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-base">
              Overharvest risk · Illustrative Sample Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}