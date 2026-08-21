import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Leaf, FlaskConical, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Role = "harvester" | "collector" | "admin";

const roles: { value: Role; label: string; icon: typeof Leaf }[] = [
  { value: "harvester", label: "Harvester", icon: Leaf },
  { value: "collector", label: "Collection Center", icon: FlaskConical },
  { value: "admin", label: "Admin", icon: ShieldCheck },
];

const roleDestinations: Record<Role, { path: "/harvest" | "/collect" | "/admin"; name: string }> = {
  harvester: { path: "/harvest", name: "Harvester" },
  collector: { path: "/collect", name: "Collection Centre (QC)" },
  admin: { path: "/admin", name: "Admin Dashboard" },
};

type AuthDialogProps = {
  trigger?: React.ReactNode;
  onGoogleSignIn?: (role: Role) => Promise<void> | void;
  onEmailSignIn?: (params: { email: string; password: string; role: Role }) => Promise<void> | void;
};

export function AuthDialog({ trigger, onGoogleSignIn, onEmailSignIn }: AuthDialogProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>("harvester");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState<"google" | "email" | null>(null);

  function routeUser(chosenRole: Role) {
    const dest = roleDestinations[chosenRole];
    toast.success(`Signed in as ${dest.name}`);
    setOpen(false);
    navigate({ to: dest.path });
  }

  async function handleGoogle() {
    setLoading("google");
    try {
      if (onGoogleSignIn) {
        await onGoogleSignIn(role);
      } else {
        await new Promise((r) => setTimeout(r, 300));
      }
      routeUser(role);
    } finally {
      setLoading(null);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Enter both an email and a password.");
      return;
    }
    setLoading("email");
    try {
      if (onEmailSignIn) {
        await onEmailSignIn({ email, password, role });
      } else {
        await new Promise((r) => setTimeout(r, 300));
      }
      routeUser(role);
    } finally {
      setLoading(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">Sign in</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {mode === "signin" ? "Sign in to RootCode" : "Create your RootCode account"}
          </DialogTitle>
          <DialogDescription>
            Choose your role, then continue with Google or email.
          </DialogDescription>
        </DialogHeader>

        {/* Role selector */}
        <div className="grid grid-cols-3 gap-2">
          {roles.map((r) => {
            const Icon = r.icon;
            const active = role === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-xs transition-colors",
                  active
                    ? "border-primary bg-secondary text-foreground"
                    : "border-border text-muted-foreground hover:bg-secondary/60",
                )}
                aria-pressed={active}
              >
                <Icon className={cn("size-4", active ? "text-primary" : "")} />
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Google OAuth */}
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={handleGoogle}
          disabled={loading !== null}
        >
          {loading === "google" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <GoogleGlyph className="size-4" />
          )}
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or continue with email</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Email / password */}
        <form className="space-y-3" onSubmit={handleEmailSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="auth-password">Password</Label>
            <Input
              id="auth-password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading !== null}>
            {loading === "email" && <Loader2 className="size-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          {mode === "signin" ? "New to RootCode?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="font-medium text-primary underline-offset-2 hover:underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Create an account" : "Sign in instead"}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
}

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.07-1.48-.22-2.13H12v3.86h6.6c-.13 1.09-.85 2.73-2.45 3.83l-.02.15 3.56 2.76.25.02c2.27-2.09 3.58-5.17 3.58-8.49"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.79-2.94c-1.01.71-2.37 1.2-4.15 1.2-3.17 0-5.86-2.09-6.82-4.98l-.14.01-3.7 2.87-.05.14C3.25 21.3 7.31 24 12 24"
      />
      <path
        fill="#FBBC05"
        d="M5.18 14.38a7.4 7.4 0 0 1-.4-2.38c0-.83.15-1.63.39-2.38l-.01-.16-3.75-2.91-.12.06A11.96 11.96 0 0 0 0 12c0 1.93.47 3.76 1.29 5.38z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c2.26 0 3.78.97 4.65 1.79l3.39-3.31C17.94 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.29 6.62l3.88 3.01C6.14 6.86 8.83 4.77 12 4.77"
      />
    </svg>
  );
}