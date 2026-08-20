import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf, ShieldCheck, Activity, FileCheck2, ArrowRight } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/rootcode/SiteHeader";
import { Sprout } from "@/components/rootcode/Sprout";
import { RootMotif, FloatingLeaves } from "@/components/rootcode/RootMotif";

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

const heroContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const cardsContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

function Home() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        {/* Hero Section: Retaining original motif visibility with a clean text backdrop mask to prevent line overlap */}
        <section className="leaf-surface relative overflow-hidden border-b border-border/70">
          <div className="pointer-events-none absolute inset-0 flex justify-center items-center overflow-hidden">
            <RootMotif className="h-full w-full max-w-4xl opacity-85 md:opacity-95 z-0" />
          </div>
          <FloatingLeaves />

          <motion.div
            className="relative mx-auto max-w-6xl px-4 py-20 md:py-28 z-20"
            variants={shouldReduceMotion ? undefined : heroContainer}
            initial={shouldReduceMotion ? undefined : "hidden"}
            animate={shouldReduceMotion ? undefined : "show"}
          >
            {/* Soft backdrop protection layer directly behind text to completely eliminate line overlap */}
            <div className="absolute inset-0 max-w-3xl h-full bg-background/60 blur-xl rounded-3xl -z-10 pointer-events-none" />

            <motion.div
              variants={shouldReduceMotion ? undefined : heroItem}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm"
            >
              <Sprout className="size-4 text-primary" />
              Field-to-formulation provenance
            </motion.div>

            <motion.h1
              variants={shouldReduceMotion ? undefined : heroItem}
              className="mt-6 max-w-3xl text-4xl leading-tight md:text-6xl"
            >
              Every root, traced back to the soil it came from.
            </motion.h1>

            <motion.p
              variants={shouldReduceMotion ? undefined : heroItem}
              className="mt-5 max-w-xl text-lg text-muted-foreground"
            >
              RootCode records each Ayurvedic herb batch at the point of harvest — geo-tagged,
              AI-verified and hash-chained — so exporters and consumers can trust the label.
            </motion.p>

            <motion.div
              variants={shouldReduceMotion ? undefined : heroItem}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Button asChild size="lg" className="transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]">
                <Link to="/harvest">
                  Start a harvest <ArrowRight className="size-4 ml-1.5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]">
                <Link to="/admin">Open dashboard</Link>
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* Four Pillars Section: Crafted with precise tactile depth, spring hover physics, and subtle border light */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-serif">Four pillars of the chain</h2>
          <motion.div
            className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            variants={shouldReduceMotion ? undefined : cardsContainer}
            initial={shouldReduceMotion ? undefined : "hidden"}
            whileInView={shouldReduceMotion ? undefined : "show"}
            viewport={{ once: true, amount: 0.3 }}
          >
            {pillars.map((p) => (
              <motion.div 
                key={p.title} 
                variants={shouldReduceMotion ? undefined : cardItem}
                whileHover={shouldReduceMotion ? undefined : { y: -6, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
              >
                <Card className="group relative flex h-full flex-col border-border/80 bg-card shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-500 overflow-hidden">
                  {/* Subtle top light edge accent line that illuminates on hover */}
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-primary opacity-0 group-hover:opacity-80 transition-opacity duration-500" />

                  <CardHeader className="space-y-3 pt-6">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary transition-transform duration-500 group-hover:scale-110">
                      <p.icon className="size-5" />
                    </span>
                    <CardTitle className="font-serif text-lg tracking-tight">{p.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between gap-4 pb-6">
                    <p className="text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                    <Button asChild variant="link" className="h-auto justify-start p-0 text-primary group/btn">
                      <Link to={p.to} className="flex items-center gap-1">
                        <span className="relative">
                          {p.cta}
                          <span className="absolute inset-x-0 -bottom-0.5 h-px bg-primary scale-x-0 group-hover/btn:scale-x-100 transition-transform origin-left duration-300" />
                        </span>
                        <ArrowRight className="size-3.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-border/70 py-8 bg-card/30">
        <p className="mx-auto max-w-6xl px-4 text-xs text-muted-foreground">
          RootCode prototype — illustrative sample data, no production records.
        </p>
      </footer>
    </div>
  );
}