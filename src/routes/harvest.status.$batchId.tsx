import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/rootcode/SiteHeader";
import { SproutSpinner } from "@/components/rootcode/Sprout";
import { ProvenanceTimeline } from "@/components/rootcode/ProvenanceTimeline";
import { dataProvider, type Batch, type Harvester } from "@/lib/data";

export const Route = createFileRoute("/harvest/status/$batchId")({
  head: () => ({
    meta: [
      { title: "My Batch Status — RootCode" },
      {
        name: "description",
        content:
          "Check the status of your submitted herb batch, including QC result and payment release.",
      },
      { property: "og:title", content: "My Batch Status — RootCode" },
    ],
  }),
  component: HarvestStatusPage,
});

// Harvester-facing status view.
// Identical to the public trace view, plus the payment section (showPaymentInfo=true).
// Linked to from the harvester submit flow — only the actual harvester sees this.
function HarvestStatusPage() {
  const { batchId } = Route.useParams();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [harvester, setHarvester] = useState<Harvester | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      dataProvider.getBatch(batchId),
      dataProvider.getWallets(),
    ])
      .then(([b, harvesters]) => {
        if (!active) return;
        setBatch(b);
        if (b) {
          setHarvester(harvesters.find((h) => h.id === b.harvester_id));
        }
      })
      .catch((e) => active && setError(e instanceof Error ? e.message : "Could not load batch"))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [batchId]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-8">

        {loading && <SproutSpinner label="Loading your batch…" />}

        {error && !loading && (
          <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {batch === null && !loading && !error && (
          <p className="mt-4 text-sm text-muted-foreground">
            Batch not found. It may still be processing.
          </p>
        )}

        {batch && !loading && (
          <ProvenanceTimeline
            batch={batch}
            harvester={harvester}
            showPaymentInfo={true}
          />
        )}
      </main>
    </div>
  );
}
