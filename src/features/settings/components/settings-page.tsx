"use client";

import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { PageHeader } from "@/components/shared/page-shell";
import { useHydrated } from "@/hooks/use-hydrated";

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-foreground/[0.07]">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

const MODES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
] as const;

export function SettingsPage() {
  const { theme: mode, setTheme: setMode } = useTheme();

  // Selection waits for hydration so the first render matches the server's.
  const hydrated = useHydrated();

  return (
    <div className="max-w-4xl space-y-6 pb-10">
      <PageHeader title="Settings" description="Appearance preferences, stored on this device." />

      <Section title="Appearance" description="Light or dark, or follow this device's setting.">
        <div className="grid gap-3 sm:grid-cols-3">
          {MODES.map(({ id, label, icon: Icon }) => {
            const active = hydrated && mode === id;
            return (
              <button
                key={id}
                onClick={() => setMode(id)}
                aria-pressed={active}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                  active ? "border-primary bg-primary/5" : "border-border hover:border-foreground/20"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{label}</span>
                {active && <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
