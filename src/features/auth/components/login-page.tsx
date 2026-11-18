"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ClipboardList, Eye, EyeOff, Library, LockKeyhole, Wallet } from "lucide-react";
import { apiError } from "@/lib/api-error";
import { isAuthenticated } from "@/lib/session";
import { useLogin } from "@/features/auth/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Backdrop, CardDoodles, Mascot, Underline } from "@/components/shared/doodles";

const HIGHLIGHTS = [
  { icon: Library, label: "Curate the question bank and curriculum" },
  { icon: ClipboardList, label: "Schedule mock tests and daily challenges" },
  { icon: Wallet, label: "Manage subscriptions, coupons and payments" },
];

/** The wordmark; there is no logo asset yet. */
function Brand({ className = "" }: { className?: string }) {
  return (
    <p className={`flex items-baseline gap-2 ${className}`}>
      <span className="text-2xl font-semibold tracking-tight">Shomadhan</span>
      <span className="text-sm font-medium opacity-60">Admin</span>
    </p>
  );
}

export function LoginPage() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const login = useLogin();
  const router = useRouter();

  // Already signed in (a bookmark, or the back button after signing in): go straight to the panel.
  useEffect(() => {
    if (isAuthenticated()) router.replace("/dashboard");
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    login.mutate(
      { mobile, password },
      // Shown in the form, not only as a toast: the toast vanished after a
      // few seconds and took the only explanation of the failure with it.
      { onError: (err: unknown) => setError(apiError(err)) },
    );
  }

  return (
    // One composition, not two full-height slabs meeting in the middle. The
    // card is the subject and the page is its setting, so the form sits
    // inside something rather than floating in an empty half.
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden p-4 sm:p-6">
      <Backdrop />

      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-card shadow-2xl ring-1 ring-white/15">
        <div className="grid lg:grid-cols-[1.05fr_1fr]">
          {/* Brand half */}
          <div
            className="relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex xl:p-12"
            style={{
              // The rail colour, blended toward the theme accent. Dark in
              // every theme, so white type on it needs no per-theme check.
              background:
                "linear-gradient(150deg, var(--hero-from) 0%," +
                " var(--hero-mid) 62%," +
                " color-mix(in oklab, var(--hero-mid) 78%, var(--sidebar-primary)) 100%)",
            }}
          >
            <CardDoodles />

            <Brand className="relative" />

            <div className="relative space-y-7 py-10">
              {/* Three beats, the last underlined, so the eye lands on the
                  promise rather than trailing off a long clause. */}
              <h2 className="text-[2.5rem] leading-[1.1] font-semibold tracking-tight xl:text-5xl">
                Every question.
                <br />
                Every exam.
                <br />
                <span className="relative inline-block">
                  One place.
                  <Underline className="absolute -bottom-1.5 left-0 h-3 w-full text-(--sidebar-primary)" />
                </span>
              </h2>

              <ul className="space-y-3.5">
                {HIGHLIGHTS.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3 text-sm">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-(--sidebar-primary) ring-1 ring-white/15">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-white/85">{label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tucked into the corner and cropped by the card edge, so it leans
                in rather than sitting on the copy. */}
            <Mascot className="pointer-events-none absolute -right-8 -bottom-10 h-36 w-36 text-white/60 xl:h-40 xl:w-40" />

            <p className="relative w-fit text-xs text-white/45">© {new Date().getFullYear()} Shomadhan</p>
          </div>

          {/* Form half */}
          <div className="flex flex-col justify-center p-8 sm:p-10 xl:p-12">
            <Brand className="mb-8 text-foreground lg:hidden" />

            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
              <p className="text-sm text-muted-foreground">Sign in to pick up where you left off.</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
              {error && (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-(--shape-sm) bg-destructive/10 p-3 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}

              {/* Mobile, not email: it is the account's USERNAME_FIELD and the
                  only identifier `/auth/login/` accepts. */}
              <div className="space-y-1.5">
                <Label htmlFor="mobile">Mobile number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="01XXXXXXXXX"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                  autoFocus
                  aria-invalid={Boolean(error)}
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    aria-invalid={Boolean(error)}
                    className="h-11 pr-11"
                  />
                  {/* Typing a password blind into a field you cannot check is
                      the most common reason a correct one gets rejected. */}
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute top-1/2 right-1 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-(--shape-sm) text-muted-foreground transition-colors duration-(--duration-short) hover:bg-accent hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="mt-2 h-11 w-full text-sm font-medium"
                disabled={login.isPending || !mobile.trim() || !password}
              >
                {login.isPending ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <LockKeyhole className="h-3.5 w-3.5" />
              Admin access only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
