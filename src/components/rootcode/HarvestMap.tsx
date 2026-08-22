import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { SproutSpinner } from "@/components/rootcode/Sprout";
import type { Batch, OverharvestZone } from "@/lib/data";
import type { HarvestMapClientProps } from "./HarvestMapClient";

export type HarvestMapProps = HarvestMapClientProps;

export function HarvestMap(props: HarvestMapProps) {
  const [ClientMap, setClientMap] = useState<React.ComponentType<HarvestMapClientProps> | null>(
    null
  );

  useEffect(() => {
    // Dynamically load Leaflet on the browser client only to prevent SSR "window is not defined"
    import("./HarvestMapClient")
      .then((mod) => {
        setClientMap(() => mod.HarvestMapClient);
      })
      .catch((err) => {
        console.error("Failed to load HarvestMapClient:", err);
      });
  }, []);

  if (!ClientMap) {
    return (
      <div
        className={`relative flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden ${
          props.className ?? ""
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-3">
          <div>
            <h2 className="font-serif text-base font-medium">
              Harvest Origins & Ecological Depletion Zones
            </h2>
            <p className="text-xs text-muted-foreground">
              Geotagged batch coordinates cross-referenced with regional wildcrafting pressure
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-[11px] font-normal"
          >
            Illustrative Sample Data — Not Live Satellite Ingestion
          </Badge>
        </div>
        <div className="flex h-[420px] w-full items-center justify-center bg-muted/20">
          <SproutSpinner label="Loading harvest map…" />
        </div>
      </div>
    );
  }

  return <ClientMap {...props} />;
}
