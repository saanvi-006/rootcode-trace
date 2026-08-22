import React, { useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QcBadge } from "@/components/rootcode/StatusBadges";
import { RotateCcw } from "lucide-react";
import type { Batch, OverharvestZone } from "@/lib/data";

export interface HarvestMapClientProps {
  batches: Batch[];
  zones: OverharvestZone[];
  className?: string;
}

// ---------------------------------------------------------------------------
// Geographic Center & Panning Bounds for India Subcontinent
// ---------------------------------------------------------------------------
const INDIA_CENTER: [number, number] = [22.3511, 78.6677];
const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [5.0, 66.0], // South-West corner (Indian Ocean buffer below Kanyakumari / West of Gujarat)
  [38.5, 99.5], // North-East corner (North of Ladakh / East of Arunachal Pradesh)
];

// ---------------------------------------------------------------------------
// Custom Circular SVG Markers matching the UI Legend
// ---------------------------------------------------------------------------
function createBatchIcon(qcStatus: "pending" | "pass" | "fail") {
  const color =
    qcStatus === "pass"
      ? "#2d6a4f" // Forest green
      : qcStatus === "fail"
      ? "#e63946" // Red
      : "#d97706"; // Amber

  const svg = `
    <div style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <defs>
          <filter id="shadow-${qcStatus}" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.35"/>
          </filter>
        </defs>
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="#ffffff" stroke-width="2.5" filter="url(#shadow-${qcStatus})"/>
        <circle cx="12" cy="12" r="4" fill="#ffffff"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: svg,
    className: "custom-leaflet-batch-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

const icons = {
  pass: createBatchIcon("pass"),
  fail: createBatchIcon("fail"),
  pending: createBatchIcon("pending"),
};

function normalizeScore(score: number): { normalized: number; pct: number } {
  const isZeroToOne = score <= 1.0 && score > 0;
  const pct = isZeroToOne ? Math.round(score * 100) : Math.round(score);
  const normalized = isZeroToOne ? score : score / 100;
  return { normalized, pct };
}

function getZoneColor(pct: number): { fill: string; stroke: string; label: string } {
  if (pct >= 65) {
    return { fill: "#ef4444", stroke: "#b91c1c", label: "High Depletion Risk" };
  }
  if (pct >= 35) {
    return { fill: "#f59e0b", stroke: "#d97706", label: "Moderate Depletion" };
  }
  return { fill: "#10b981", stroke: "#059669", label: "Sustainable / Low Risk" };
}

// ---------------------------------------------------------------------------
// Reset View Controller
// ---------------------------------------------------------------------------
function MapViewController({ resetKey }: { resetKey: number }) {
  const map = useMap();

  React.useEffect(() => {
    map.setView(INDIA_CENTER, 4.8, { animate: true });
  }, [resetKey, map]);

  return null;
}

export function HarvestMapClient({ batches, zones, className = "" }: HarvestMapClientProps) {
  const [resetKey, setResetKey] = React.useState(0);

  const validBatches = useMemo(() => {
    return batches.filter((b) => {
      const isValidNumber =
        typeof b.gps_lat === "number" &&
        typeof b.gps_lon === "number" &&
        !isNaN(b.gps_lat) &&
        !isNaN(b.gps_lon) &&
        !(b.gps_lat === 0 && b.gps_lon === 0);

      if (!isValidNumber) return false;

      const isInsideIndia =
        b.gps_lat >= INDIA_BOUNDS[0][0] &&
        b.gps_lat <= INDIA_BOUNDS[1][0] &&
        b.gps_lon >= INDIA_BOUNDS[0][1] &&
        b.gps_lon <= INDIA_BOUNDS[1][1];

      if (!isInsideIndia) {
        console.warn(
          `[HarvestMap] Batch marker coordinates outside India bounding box: Batch ID "${b.id}" (${b.species_claimed}) at [${b.gps_lat}, ${b.gps_lon}]`
        );
      }

      return true;
    });
  }, [batches]);

  const validZones = useMemo(() => {
    return zones.filter(
      (z) =>
        typeof z.lat === "number" &&
        typeof z.lon === "number" &&
        !isNaN(z.lat) &&
        !isNaN(z.lon) &&
        !(z.lat === 0 && z.lon === 0)
    );
  }, [zones]);

  return (
    <div
      className={`relative flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden ${className}`}
    >
      {/* Map Header & Satellite Disclaimer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-3">
        <div>
          <h2 className="font-serif text-base font-medium">
            Harvest Origins & Ecological Depletion Zones
          </h2>
          <p className="text-xs text-muted-foreground">
            Geotagged batch coordinates cross-referenced with regional wildcrafting pressure
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setResetKey((k) => k + 1)}
            className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3" /> Reset View
          </Button>
          <Badge
            variant="outline"
            className="border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-[11px] font-normal"
          >
            Illustrative Sample Data — Not Live Satellite Ingestion
          </Badge>
        </div>
      </div>

      {/* Map Canvas - Height 480px for full India coverage from Kashmir to Kanyakumari */}
      <div className="relative h-[480px] w-full bg-muted/20">
        <MapContainer
          center={INDIA_CENTER}
          zoom={4.8}
          minZoom={4.2}
          maxZoom={12}
          maxBounds={INDIA_BOUNDS}
          maxBoundsViscosity={1.0}
          scrollWheelZoom={false}
          className="h-full w-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapViewController resetKey={resetKey} />

          {/* Overharvest / Depletion Zones as Circle Overlays */}
          {validZones.map((zone) => {
            const { pct } = normalizeScore(zone.depletion_score);
            const colorInfo = getZoneColor(pct);

            return (
              <Circle
                key={zone.id}
                center={[zone.lat, zone.lon]}
                radius={45000} // 45km radius
                pathOptions={{
                  color: colorInfo.stroke,
                  fillColor: colorInfo.fill,
                  fillOpacity: 0.2,
                  weight: 2,
                  dashArray: "4, 6",
                }}
              >
                <Popup>
                  <div className="space-y-1.5 p-1 text-xs">
                    <div className="font-serif font-semibold text-sm">{zone.region}</div>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block size-2.5 rounded-full"
                        style={{ backgroundColor: colorInfo.fill }}
                      />
                      <span className="font-medium">{colorInfo.label}</span>
                      <span className="text-muted-foreground">({pct}% depletion)</span>
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      Lat: {zone.lat.toFixed(4)}, Lon: {zone.lon.toFixed(4)}
                    </div>
                    <div className="mt-1 border-t pt-1 text-[10px] italic text-amber-700 dark:text-amber-400">
                      Illustrative Sample Data — Not Live Satellite Ingestion
                    </div>
                  </div>
                </Popup>
              </Circle>
            );
          })}

          {/* Batch Harvest Markers */}
          {validBatches.map((batch) => {
            const icon = icons[batch.qc_status] || icons.pending;

            return (
              <Marker
                key={batch.id}
                position={[batch.gps_lat, batch.gps_lon]}
                icon={icon}
              >
                <Popup>
                  <div className="space-y-2 p-1 text-xs">
                    <div className="flex items-center justify-between gap-2 border-b pb-1">
                      <span className="font-serif font-semibold text-sm">
                        {batch.species_claimed}
                      </span>
                      <QcBadge status={batch.qc_status} />
                    </div>

                    <dl className="space-y-1 text-xs">
                      {batch.quantity_kg != null && batch.quantity_kg > 0 && (
                        <div className="flex justify-between gap-2">
                          <dt className="text-muted-foreground">Quantity:</dt>
                          <dd className="font-medium">{batch.quantity_kg} kg</dd>
                        </div>
                      )}
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">AI Match:</dt>
                        <dd className="italic font-medium">{batch.species_ai_result}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Coordinates:</dt>
                        <dd className="font-mono text-[11px]">
                          {batch.gps_lat.toFixed(4)}, {batch.gps_lon.toFixed(4)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Batch ID:</dt>
                        <dd className="font-mono text-[10px]">{batch.id.slice(0, 8)}…</dd>
                      </div>
                    </dl>

                    <div className="pt-1 border-t">
                      <Link
                        to="/trace/$batchId"
                        params={{ batchId: batch.id }}
                        className="inline-block text-primary font-medium underline-offset-4 hover:underline"
                      >
                        View Full Provenance Timeline ↗
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Map Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-muted/10 px-4 py-2.5 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-medium text-foreground">Batch Markers:</span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#2d6a4f]" /> QC Passed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#d97706]" /> QC Pending
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#e63946]" /> QC Failed
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <span className="font-medium text-foreground">Zone Pressure Overlays:</span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-emerald-500" /> Low (&lt;35%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-amber-500" /> Moderate (35–64%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-rose-500" /> High (&ge;65%)
          </span>
        </div>
      </div>
    </div>
  );
}
