import { Badge } from "@/components/ui/badge";
import type { Batch } from "@/lib/data";

export function QcBadge({ status }: { status: Batch["qc_status"] }) {
  if (status === "pass")
    return <Badge className="border-transparent bg-success text-success-foreground">QC Pass</Badge>;
  if (status === "fail") return <Badge variant="destructive">QC Fail</Badge>;
  return (
    <Badge className="border-transparent bg-warning text-warning-foreground">QC Pending</Badge>
  );
}

export function PaymentBadge({ status }: { status: Batch["payment_status"] }) {
  if (status === "released") {
    return (
      <Badge variant="outline" className="border-success/40 text-success">
        Payment released
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-earth/40 text-earth">
      Payment pending
    </Badge>
  );
}

export function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const tone =
    score >= 0.85
      ? "bg-success text-success-foreground"
      : score >= 0.7
        ? "bg-accent text-accent-foreground"
        : "bg-destructive text-destructive-foreground";
  return <Badge className={`border-transparent ${tone}`}>{pct}% confidence</Badge>;
}

export function HashChip({ label, value }: { label: string; value: string | null }) {
  return (
    <span className="hash-chip inline-flex items-center gap-1.5">
      <span className="opacity-60">{label}</span>
      <span>{value ?? "genesis"}</span>
    </span>
  );
}
