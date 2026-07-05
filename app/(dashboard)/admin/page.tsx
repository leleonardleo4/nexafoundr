import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PendingStartupsTable } from "@/components/admin/pending-startups-table";
import { PendingInvestmentsTable } from "@/components/admin/pending-investments-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getDashboardPath, isDashboardRole } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

async function getAdminUser() {
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
      role: true,
    },
  });

  if (!user || !isDashboardRole(user.role)) {
    redirect("/");
  }

  if (user.role !== "ADMIN") {
    redirect(getDashboardPath(user.role));
  }

  return user;
}

export default async function AdminDashboardPage() {
  const user = await getAdminUser();

  const pendingStartups = await prisma.startup.findMany({
    where: {
      verificationStatus: "PENDING",
    },
    include: {
      founder: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const pendingInvestments = await prisma.investment.findMany({
    where: {
      status: "PENDING",
    },
    include: {
      investor: {
        select: {
          name: true,
          email: true,
        },
      },
      startup: {
        select: {
          name: true,
          founder: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  return (
    <div className="space-y-8">
      <section
        id="dashboard-stats"
        className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60"
      >
        <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
          Admin verification dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
          Review pending startups, {user.name}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Approve startup submissions and confirm investor commitments before
          they move into funded status.
        </p>
      </section>

      <Card id="pending-startups">
        <CardHeader>
          <CardTitle>Pending startup approvals</CardTitle>
          <CardDescription>
            Every row below is waiting on an admin decision.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PendingStartupsTable startups={pendingStartups} />
        </CardContent>
      </Card>

      <Card id="pending-investments">
        <CardHeader>
          <CardTitle>Pending investment approvals</CardTitle>
          <CardDescription>
            Investor commitments below still need admin confirmation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PendingInvestmentsTable investments={pendingInvestments} />
        </CardContent>
      </Card>
    </div>
  );
}
