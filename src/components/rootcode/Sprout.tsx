import { cn } from "@/lib/utils";

export function Sprout({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-6", className)}
      aria-hidden="true"
    >
      <path d="M12 21v-8" />
      <path d="M12 13c0-3.3-2.5-6-5.8-6.2C6 10.2 8.4 13 12 13Z" />
      <path d="M12 13c0-2.8 2.1-5.1 4.9-5.3C16.6 10.9 14.6 13 12 13Z" />
      <path d="M9.5 21h5" />
    </svg>
  );
}

export function SproutSpinner({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 py-10", className)}>
      <Sprout className="size-7 animate-pulse text-primary" />
      <p className="text-sm text-muted-foreground">{label ?? "Loading…"}</p>
    </div>
  );
}
