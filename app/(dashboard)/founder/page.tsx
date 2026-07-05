import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { StartupVerificationForm } from "@/components/founder/startup-verification-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      name: true,
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

export default async function FounderDashboardPage() {
  const user = await getFounderUser();

  const startups = await prisma.startup.findMany({
    where: {
      founderId: user.id,
    },
    orderBy: {
      name: "asc",
    },
  });

  const investments = await prisma.investment.findMany({
    where: {
      startup: {
        founderId: user.id,
      },
    },
    select: {
      amount: true,
      status: true,
    },
  });

  const totalFundingRequested = startups.reduce(
    (total, startup) => total + startup.fundingRequired,
    0,
  );
  const activeInvestments = investments.filter(
    (investment) => investment.status === "PENDING" || investment.status === "FUNDED",
  ).length;
  const startupStatusSummary = startups.length
    ? `${startups.filter((startup) => startup.verificationStatus === "VERIFIED").length} verified / ${startups.filter((startup) => startup.verificationStatus === "PENDING").length} pending`
    : "No listings yet";

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
            Founder&apos;s Hub
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
            Welcome back, {user.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Keep track of your startup pipeline, funding requests, and the
            investment activity around your listings.
          </p>
        </div>

        <Button asChild>
          <Link href="/settings">Manage profile</Link>
        </Button>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Submit startup for verification</CardTitle>
          <CardDescription>
            Complete the required review steps before your startup can appear
            in the investor marketplace.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <StartupVerificationForm />
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="listings">Listings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <section className="grid gap-4 md:grid-cols-3">
            {[
              {
                label: "Total Funding Requested",
                value: `NGN ${totalFundingRequested.toLocaleString()}`,
                description: "Combined capital target across all of your startups.",
              },
              {
                label: "Active Investments",
                value: activeInvestments.toString(),
                description: "Open and funded commitments linked to your listings.",
              },
              {
                label: "Startup Status",
                value: startupStatusSummary,
                description: "A quick view of your verification mix.",
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

        <TabsContent value="listings">
          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Your current listings</CardTitle>
                <CardDescription>
                  View the startups you have already placed on the platform.
                </CardDescription>
              </div>
              <Button asChild className="bg-zinc-200 text-zinc-950 hover:bg-zinc-300 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200">
                <Link href="/investor/startups">View public directory</Link>
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {startups.length > 0 ? (
                startups.map((startup) => (
                  <article
                    key={startup.id}
                    className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                          {startup.name}
                        </h3>
                        <p className="text-sm text-zinc-500">
                          {startup.industry} | {startup.stage}
                        </p>
                      </div>
                      <span className="inline-flex w-fit rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {startup.verificationStatus}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                      Funding requested: NGN {startup.fundingRequired.toLocaleString()}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
                  <p className="text-sm text-zinc-500">
                    You do not have any startup listings yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

