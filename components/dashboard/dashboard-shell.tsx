"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNav } from "@/components/dashboard/top-nav";
import type { DashboardRole } from "@/lib/utils";

type DashboardUser = {
  name: string;
  email: string;
  profileImage: string | null;
  role: DashboardRole;
};

type DashboardShellProps = {
  user: DashboardUser;
  children: ReactNode;
};

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="flex min-h-screen">
        <Sidebar role={user.role} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopNav user={user} onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
