import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { UserCircle2, Menu, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sprout } from "./Sprout";
import { AuthDialog } from "@/components/rootcode/AuthDialog";

const nav = [
  { to: "/harvest", label: "Harvest" },
  { to: "/collect", label: "Collection" },
  { to: "/admin", label: "Admin" },
] as const;

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <Sprout className="size-6 text-primary" />
          <span className="font-serif text-lg font-semibold tracking-tight">RootCode</span>
        </Link>

        {/* Desktop nav — hidden below md */}
        <div className="hidden items-center gap-1 md:flex">
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

          <AuthDialog
            trigger={
              <Button variant="outline" size="sm" className="ml-2 gap-1.5">
                <UserCircle2 className="size-4" />
                Sign in
              </Button>
            }
          />
        </div>

        {/* Mobile menu toggle — hidden from md up */}
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-md text-foreground md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={shouldReduceMotion ? undefined : { height: 0, opacity: 0 }}
            animate={shouldReduceMotion ? undefined : { height: "auto", opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t border-border/70 md:hidden"
          >
            <nav className="flex flex-col gap-1 px-4 py-3">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  activeProps={{ className: "bg-secondary text-foreground" }}
                >
                  {item.label}
                </Link>
              ))}
              <AuthDialog
                trigger={
                  <Button variant="outline" size="sm" className="mt-2 w-full gap-1.5">
                    <UserCircle2 className="size-4" />
                    Sign in
                  </Button>
                }
              />
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}