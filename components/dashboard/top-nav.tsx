"use client";

import Image from "next/image";
import { ChevronDown, Menu, LogOut, Bell } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { WalletConnectButton } from "@/components/solana/wallet-connect-button";
import type { DashboardRole } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const notifications = 3;

type TopNavUser = {
  name: string;
  email: string;
  profileImage: string | null;
  role: DashboardRole;
};

type TopNavProps = {
  user: TopNavUser;
  onMenuClick: () => void;
};

export function TopNav({ user, onMenuClick }: TopNavProps) {
  async function handleLogout() {
    await authClient.signOut?.();
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-zinc-50/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:text-zinc-950 md:hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
            Menu
          </button>

          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500 md:hidden">
              nexafoundr
            </p>
            <h2 className="truncate text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              {user.role === "FOUNDER"
                ? "Founder Dashboard"
                : user.role === "INVESTOR"
                  ? "Investor Dashboard"
                  : "Admin Dashboard"}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <WalletConnectButton />
          </div>

          <button
            type="button"
            className="relative inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
            aria-label={`Notifications (${notifications})`}
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alerts</span>
            {notifications > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-semibold text-white">
                {notifications}
              </span>
            ) : null}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-3 rounded-full border border-zinc-200 bg-white px-3 py-2 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
                aria-label="Open account menu"
              >
                {user.profileImage ? (
                  <Image
                    src={user.profileImage}
                    alt={user.name}
                    width={36}
                    height={36}
                    unoptimized
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950">
                    {user.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                )}
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{user.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
                </div>
                <ChevronDown className="hidden h-4 w-4 text-zinc-400 sm:block" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{user.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
