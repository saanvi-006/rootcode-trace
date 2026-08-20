import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf, ShieldCheck, Activity, FileCheck2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/rootcode/SiteHeader";
import { Sprout } from "@/components/rootcode/Sprout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RootCode — Ayurvedic Herb Traceability" },
      {
        name: "description",
        content:
          "RootCode traces Ayurvedic herbs from harvest to export with AI species verification, a tamper-evident ledger and overharvest monitoring.",
      },
      { property: "og:title", content: "RootCode — Ayurvedic Herb Traceability" },
      {
        property: "og:description",
        content:
          "Field-to-formulation provenance for Ayurvedic botanicals: AI species checks, hash-chained batches, export certificates.",
      },
    ],
  }),
  component: Home,
});

const pillars = [
  {
    icon: Leaf,
    title: "AI Species Verification",
    body: "Every harvest photo is checked against the claimed botanical, with a confidence score attached to the batch.",
    to: "/harvest" as const,
    cta: "Log a harvest",
  },
  {
    icon: ShieldCheck,
    title: "Tamper-Evident Ledger",
    body: "Batches are hash-chained to their predecessor, so any edit downstream breaks the chain visibly.",
    to: "/admin" as const,
    cta: "View ledger",
  },
  {
    icon: Activity,
    title: "Overharvest Monitoring",
    body: "Collection density per region is scored so depleted zones are flagged before the season turns.",
    to: "/admin" as const,
    cta: "See risk zones",
  },
  {
    icon: FileCheck2,
    title: "Export Certificate",
    body: "One provenance page per batch — species, geo-origin, QC verdict — exportable as a certificate.",
    to: "/collect" as const,
    cta: "Review batches",
  },
];

function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="leaf-surface border-b border-border/70">
          <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Sprout className="size-4 text-primary" />
              Field-to-formulation provenance
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl leading-tight md:text-6xl">
              Every root, traced back to the soil it came from.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              RootCode records each Ayurvedic herb batch at the point of harvest — geo-tagged,
              AI-verified and hash-chained — so exporters and consumers can trust the label.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/harvest">
                  Start a harvest <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/admin">Open dashboard</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl md:text-3xl">Four pillars of the chain</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p) => (
              <Card key={p.title} className="flex flex-col border-border/80 bg-card">
                <CardHeader className="space-y-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
                    <p.icon className="size-5" />
                  </span>
                  <CardTitle className="font-serif text-lg">{p.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                  <Button asChild variant="link" className="h-auto justify-start p-0 text-primary">
                    <Link to={p.to}>
                      {p.cta} <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 py-8">
        <p className="mx-auto max-w-6xl px-4 text-xs text-muted-foreground">
          RootCode prototype — illustrative sample data, no production records.
        </p>
      </footer>
    </div>
  );
}
