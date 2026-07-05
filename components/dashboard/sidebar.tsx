"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartColumn,
  LayoutDashboard,
  Rocket,
  Settings,
  X,
} from "lucide-react";

import type { DashboardRole } from "@/lib/utils";

type SidebarProps = {
  role: DashboardRole;
  open: boolean;
  onClose: () => void;
};

const navigationMap = {
  FOUNDER: [
    { href: "/founder", label: "Dashboard", icon: LayoutDashboard },
    { href: "/founder/startups", label: "Startups", icon: Rocket },
    { href: "/founder/investments", label: "Investments", icon: ChartColumn },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
  INVESTOR: [
    { href: "/investor", label: "Dashboard", icon: LayoutDashboard },
    { href: "/investor/startups", label: "Startups", icon: Rocket },
    { href: "/investor/investments", label: "Investments", icon: ChartColumn },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
  ADMIN: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin#pending-startups", label: "Startups", icon: Rocket },
    { href: "/admin#dashboard-stats", label: "Investments", icon: ChartColumn },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
} satisfies Record<DashboardRole, Array<{ href: string; label: string; icon: ComponentType<{ className?: string }> }>>;

export function Sidebar({ role, open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const navigationItems = navigationMap[role];

  return (
    <>
      <aside className="hidden h-screen w-72 shrink-0 border-r border-zinc-200 bg-white/90 px-5 py-6 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 md:flex md:flex-col">
        <SidebarContent
          role={role}
          pathname={pathname}
          navigationItems={navigationItems}
        />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close sidebar"
            className="absolute inset-0 bg-zinc-950/50"
            onClick={onClose}
          />

          <aside className="relative z-50 h-full w-80 max-w-[85vw] border-r border-zinc-200 bg-white px-5 py-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
                  9jaFounders
                </p>
                <h1 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                  Dashboard
                </h1>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <SidebarContent
              role={role}
              pathname={pathname}
              navigationItems={navigationItems}
              onNavigate={onClose}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}

type SidebarContentProps = {
  role: DashboardRole;
  pathname: string;
  navigationItems: Array<{
    href: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
  }>;
  onNavigate?: () => void;
};

function SidebarContent({ role, pathname, navigationItems, onNavigate }: SidebarContentProps) {
  return (
    <>
      <div className="mb-8 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
          9jaFounders
        </p>
        <h1 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          {role === "FOUNDER"
            ? "Founder Hub"
            : role === "INVESTOR"
              ? "Investor Hub"
              : "Admin Hub"}
        </h1>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navigationItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/settings" && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
          Ready to grow?
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Track your startups, back founders, and manage opportunities.
        </p>
      </div>
    </>
  );
}
