"use client";

import * as React from "react";
import { MoonStar, SunMedium } from "lucide-react";

import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      disabled={!mounted}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-sm font-medium text-[color:var(--foreground)] shadow-sm transition hover:border-[color:var(--primary)] hover:bg-[color:var(--surface)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
      <span className="hidden sm:inline">{isDark ? "Light mode" : "Dark mode"}</span>
      <span className="sm:hidden">{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
