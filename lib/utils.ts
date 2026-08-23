import type { UserRole } from "@prisma/client";

export type DashboardRole = Extract<UserRole, "FOUNDER" | "INVESTOR" | "ADMIN">;
export type AdminRole = Extract<UserRole, "ADMIN">;

export type DashboardNavItem = {
  href: string;
  label: string;
};

export function isDashboardRole(role: UserRole | null | undefined): role is DashboardRole {
  return role === "FOUNDER" || role === "INVESTOR" || role === "ADMIN";
}

export function isAdminRole(role: UserRole | null | undefined): role is AdminRole {
  return role === "ADMIN";
}

export function getDisplayEmail(email: string) {
  return email.endsWith("@privy.local") ? "Wallet account" : email;
}

export function getDashboardPath(role: DashboardRole) {
  if (role === "FOUNDER") {
    return "/founder";
  }

  if (role === "INVESTOR") {
    return "/investor";
  }

  return "/admin";
}

export function getDashboardNavigation(role: DashboardRole): DashboardNavItem[] {
  if (role === "FOUNDER") {
    return [
      { href: getDashboardPath(role), label: "Dashboard" },
      { href: "/founder", label: "Startups" },
      { href: "/settings", label: "Settings" },
    ];
  }

  if (role === "ADMIN") {
    return [
      { href: getDashboardPath(role), label: "Dashboard" },
      { href: "/admin#pending-startups", label: "Startups" },
      { href: "/admin#dashboard-stats", label: "Investments" },
      { href: "/settings", label: "Settings" },
    ];
  }

  return [
    { href: getDashboardPath(role), label: "Dashboard" },
    { href: "/investor/startups", label: "Startups" },
    { href: "/investor/investments", label: "Investments" },
    { href: "/settings", label: "Settings" },
  ];
}
