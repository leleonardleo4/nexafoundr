import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth } from "@/lib/auth";
import { getDashboardPath, isDashboardRole } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

async function getFounderUser() {
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
      role: true,
    },
  });

  if (!user || !isDashboardRole(user.role)) {
    redirect("/");
  }

  if (user.role !== "FOUNDER") {
    redirect(getDashboardPath(user.role));
  }

  return user;
}

export default async function FounderInvestmentsPage() {
  const user = await getFounderUser();

  const investments = await prisma.investment.findMany({
    where: {
      startup: {
        founderId: user.id,
      },
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
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  const totalCommitted = investments.reduce(
    (total, investment) => total + investment.amount,
    0,
  );

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
          Founder investments
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
          Investment activity
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Track commitments investors have made across your startup listings.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Total committed</CardDescription>
            <CardTitle>NGN {totalCommitted.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Investment records</CardDescription>
            <CardTitle>{investments.length}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent investments</CardTitle>
          <CardDescription>
            Every pending, funded, and released investment tied to your listings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {investments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Startup</TableHead>
                  <TableHead>Investor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.map((investment) => (
                  <TableRow key={investment.id}>
                    <TableCell>{investment.startup.name}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{investment.investor.name}</p>
                        <p className="text-xs text-zinc-500">{investment.investor.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>NGN {investment.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge>{investment.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-md border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
              <p className="text-sm text-zinc-500">
                No investment activity has been recorded yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
