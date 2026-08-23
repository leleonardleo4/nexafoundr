"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useWallet } from "@solana/wallet-adapter-react";
import { ChevronDown, Menu, LogOut, Bell } from "lucide-react";

import type { DashboardNotificationFeed } from "@/lib/dashboard-notifications";
import { getDisplayEmail, type DashboardRole } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { persistLastWalletSession } from "@/lib/wallet-session";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TopNavUser = {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  role: DashboardRole;
};

type TopNavProps = {
  user: TopNavUser;
  notifications: DashboardNotificationFeed;
  onMenuClick: () => void;
};

function getNotificationToneClass(tone: DashboardNotificationFeed["items"][number]["tone"]) {
  if (tone === "payment") {
    return "bg-[color:var(--accent)] text-[color:var(--accent-foreground)]";
  }

  if (tone === "request") {
    return "bg-[color:var(--secondary)] text-[color:var(--secondary-foreground)]";
  }

  if (tone === "admin") {
    return "bg-violet-500 text-white";
  }

  return "bg-sky-500 text-white";
}

export function TopNav({ user, notifications, onMenuClick }: TopNavProps) {
  const router = useRouter();
  const { logout } = usePrivy();
  const { publicKey, connected } = useWallet();

  async function handleLogout() {
    if (connected && publicKey) {
      persistLastWalletSession({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        walletAddress: publicKey.toBase58(),
      });
    }

    await logout();
    await fetch("/api/auth/session", { method: "DELETE" });
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[color:var(--surface)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm font-medium text-[color:var(--foreground)] shadow-sm transition hover:border-[color:var(--primary)] md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
            Menu
          </button>

          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--muted-foreground)] md:hidden">
              nexafoundr
            </p>
            <h2 className="truncate text-lg font-semibold text-[color:var(--foreground)]">
              {user.role === "FOUNDER"
                ? "Founder Dashboard"
                : user.role === "INVESTOR"
                  ? "Investor Dashboard"
                  : "Admin Dashboard"}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="relative inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm font-medium text-[color:var(--foreground)] shadow-sm transition hover:border-[color:var(--primary)]"
                aria-label={`Notifications (${notifications.unreadCount})`}
              >
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Alerts</span>
                {notifications.unreadCount > 0 ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--accent)] px-1.5 text-[10px] font-semibold text-[color:var(--accent-foreground)]">
                    {notifications.unreadCount}
                  </span>
                ) : null}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[color:var(--foreground)]">Alerts</p>
                  <p className="text-xs text-[color:var(--muted-foreground)]">
                    DMs, requests, and payment activity
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {notifications.items.length > 0 ? (
                notifications.items.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    onClick={() => router.push(notification.href)}
                    className="items-start gap-3 py-3"
                  >
                    <span
                      className={`mt-0.5 inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${getNotificationToneClass(notification.tone)}`}
                    />
                    <span className="min-w-0 text-left">
                      <span className="block text-sm font-medium text-[color:var(--foreground)]">
                        {notification.title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[color:var(--muted-foreground)]">
                        {notification.description}
                      </span>
                    </span>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-[color:var(--muted-foreground)]">
                  No new alerts right now.
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-3 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 shadow-sm transition hover:border-[color:var(--primary)]"
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
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--primary)] text-sm font-semibold text-[color:var(--primary-foreground)]">
                    {user.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                )}
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium text-[color:var(--foreground)]">{user.name}</p>
                  <p className="text-xs text-[color:var(--muted-foreground)]">{getDisplayEmail(user.email)}</p>
                </div>
                <ChevronDown className="hidden h-4 w-4 text-[color:var(--muted-foreground)] sm:block" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[color:var(--foreground)]">{user.name}</p>
                  <p className="text-xs text-[color:var(--muted-foreground)]">{getDisplayEmail(user.email)}</p>
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
