import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireDashboardSessionUser } from "@/lib/dashboard-session";
import { prisma } from "@/lib/prisma";

export default async function InvestorDashboardPage() {
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
    },
    orderBy: {
      id: "desc",
    },
  });

  const recommendedStartups = await prisma.startup.findMany({
    where: {
      verificationStatus: "VERIFIED",
    },
    orderBy: {
      name: "asc",
    },
    take: 4,
  });

  const conversations = await prisma.conversation.findMany({
    where: {
      investorId: user.id,
    },
    select: {
      id: true,
      status: true,
      updatedAt: true,
      founder: {
        select: {
          name: true,
        },
      },
      startup: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 5,
  });

  const totalCapitalCommitted = investments.reduce(
    (total, investment) => total + investment.amount,
    0,
  );
  const numberOfInvestments = investments.length;
  const portfolioPerformance = numberOfInvestments
    ? `${Math.round(
        (investments.filter((investment) => investment.status === "RELEASED").length /
          numberOfInvestments) *
          100,
      )}% realized`
    : "0% realized";

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
            Investor&apos;s Hub
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
            Investment Overview
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Review your commitment history, track portfolio performance, and
            discover the startups most worth your attention.
          </p>
        </div>

        <Button asChild>
          <Link href="/investor/startups">Browse startups</Link>
        </Button>
      </section>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="recommended">Recommended Startups</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <section className="grid gap-4 md:grid-cols-3">
            {[
              {
                label: "Total Capital Committed",
                value: `USD ${totalCapitalCommitted.toLocaleString()}`,
                description: "Total capital across every investment record.",
              },
              {
                label: "Number of Investments",
                value: numberOfInvestments.toString(),
                description: "How many startups are in your current portfolio.",
              },
              {
                label: "Portfolio Performance",
                value: portfolioPerformance,
                description: "A quick snapshot of released capital to date.",
              },
            ].map((item) => (
              <Card key={item.label}>
                <CardHeader>
                  <CardDescription>{item.label}</CardDescription>
                  <CardTitle className="text-2xl">{item.value}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-500">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </section>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Recent conversations</CardTitle>
                <CardDescription>
                  Keep track of the founders you have connected with.
                </CardDescription>
              </div>

              <Button asChild className="bg-zinc-200 text-zinc-950 hover:bg-zinc-300 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200">
                <Link href="/messages">Open inbox</Link>
              </Button>
            </CardHeader>

            <CardContent>
              {conversations.length > 0 ? (
                <div className="space-y-4">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                          {conversation.startup?.name ?? conversation.founder.name}
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          Founder: {conversation.founder.name}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Status: {conversation.status}
                        </p>
                      </div>

                      <Button asChild>
                        <Link href={`/messages/${conversation.id}`}>
                          {conversation.status === "ACTIVE" ? "Open chat room" : "Review request"}
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
                  <p className="text-sm text-zinc-500">
                    No conversations yet. Connect with a founder to get started.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommended">
          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Recommended Startups</CardTitle>
                <CardDescription>
                  A short list of verified startups to explore next.
                </CardDescription>
              </div>

              <Button asChild className="bg-zinc-200 text-zinc-950 hover:bg-zinc-300 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200">
                <Link href="/investor/startups">Open full directory</Link>
              </Button>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 lg:grid-cols-2">
                {recommendedStartups.length > 0 ? (
                  recommendedStartups.map((startup) => (
                    <article
                      key={startup.id}
                      className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                            {startup.name}
                          </h3>
                          <p className="text-sm text-zinc-500">
                            {startup.industry} | {startup.stage}
                          </p>
                        </div>
                        <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          VERIFIED
                        </span>
                      </div>

                      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                        Funding required: USD {startup.fundingRequired.toLocaleString()}
                      </p>

                      <div className="mt-4">
                        <Button asChild>
                          <Link href="/investor/startups">View in directory</Link>
                        </Button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
                    <p className="text-sm text-zinc-500">
                      No verified startups are available right now.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
