import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireDashboardSessionUser } from "@/lib/dashboard-session";
import { prisma } from "@/lib/prisma";
import { MilestoneApprovalList } from "@/components/solana/milestone-approval-list";
import { ProjectOverview } from "@/components/investor/project-overview";

export default async function InvestorInvestmentsPage() {
  const user = await requireDashboardSessionUser("INVESTOR");

  const investments = await prisma.investment.findMany({
    where: {
      investorId: user.id,
    },
    include: {
      startup: {
        select: {
          id: true,
          name: true,
          industry: true,
          stage: true,
          fundingRequired: true,
        },
      },
      milestones: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          title: true,
          description: true,
          amountLamports: true,
          status: true,
          dueDate: true,
          approvedAt: true,
          releasedAt: true,
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
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
            Investor investments
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
            Your portfolio
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Monitor every commitment you have made and follow each investment
            through its current status.
          </p>
        </div>

        <Button asChild>
          <Link href="/investor/startups">Browse startups</Link>
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Total capital committed</CardDescription>
            <CardTitle>USD {totalCommitted.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Number of investments</CardDescription>
            <CardTitle>{investments.length}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Investment records</CardTitle>
          <CardDescription>
            Your pending-deposit, funded, and released commitments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {investments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Startup</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Profile</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.map((investment) => (
                  <TableRow key={investment.id}>
                    <TableCell>{investment.startup.name}</TableCell>
                    <TableCell>
                      {investment.startup.industry} | {investment.startup.stage}
                    </TableCell>
                    <TableCell>USD {investment.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge>{investment.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          asChild
                          className="h-9 bg-zinc-100 px-3 text-zinc-950 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
                        >
                          <Link href={`/investor/startups/${investment.startup.id}`}>
                            View
                          </Link>
                        </Button>
                        <Button
                          asChild
                          className="h-9 bg-zinc-950 px-3 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
                        >
                          <Link href={`/investor/startups/${investment.startup.id}`}>
                            Revisit startup
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-md border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
              <p className="text-sm text-zinc-500">
                You have not made any investments yet.
              </p>
              <Button asChild className="mt-4">
                <Link href="/investor/startups">Explore marketplace</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {investments.length > 0 ? (
        <section className="space-y-6">
          {investments.map((investment) => (
            <div key={investment.id} className="space-y-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
                    {investment.startup.name}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-zinc-950 dark:text-zinc-50">
                    Escrow controls
                  </h2>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Review the live funding progress, deposit state, and milestone ledger
                  for this project.
                </p>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
                <ProjectOverview investment={investment} />

                <MilestoneApprovalList
                  investmentId={investment.id}
                  founderAddress={investment.founderWalletAddress}
                  investorWalletAddress={investment.investorWalletAddress}
                  escrowAddress={investment.escrowAddress}
                  milestones={investment.milestones}
                />
              </div>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
