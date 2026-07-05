import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { auth } from "@/lib/auth";
import { isDashboardRole } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

async function getDashboardUser() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      role: true,
    },
  });

  if (!user || !isDashboardRole(user.role)) {
    redirect("/");
  }

  return user as typeof user & {
    role: "FOUNDER" | "INVESTOR" | "ADMIN";
  };
}

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getDashboardUser();

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
