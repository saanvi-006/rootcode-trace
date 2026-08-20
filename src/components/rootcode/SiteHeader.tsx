import { Link } from "@tanstack/react-router";
import { Sprout } from "./Sprout";

const nav = [
  { to: "/harvest", label: "Harvest" },
  { to: "/collect", label: "Collection" },
  { to: "/admin", label: "Admin" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <Sprout className="size-6 text-primary" />
          <span className="font-serif text-lg font-semibold tracking-tight">RootCode</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
