import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { InvestNowForm } from "@/components/investments/invest-now-form";
import { ConnectionRequestCard } from "@/components/investor/connection-request-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { getDashboardPath, isDashboardRole } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

async function getInvestorUser() {
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

  if (user.role !== "INVESTOR") {
    redirect(getDashboardPath(user.role));
  }

  return user as typeof user & {
    role: "INVESTOR";
  };
}

type StartupDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function StartupDetailPage({ params }: StartupDetailPageProps) {
  const investor = await getInvestorUser();
  const { id } = await params;

  const startup = await prisma.startup.findUnique({
    where: {
      id,
    },
    include: {
      founder: {
        select: {
          id: true,
          name: true,
          founderWalletAddress: true,
        },
      },
    },
  });

  if (!startup || startup.verificationStatus !== "VERIFIED") {
    notFound();
  }

  const existingConversation = await prisma.conversation.findUnique({
    where: {
      founderId_investorId: {
        founderId: startup.founder.id,
        investorId: investor.id,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-6">
        <Card>
          <CardHeader>
            <CardDescription>Startup story</CardDescription>
            <CardTitle className="text-3xl">{startup.name}</CardTitle>
            <p className="text-sm text-zinc-500">
              Founder: {startup.founder.name}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              {startup.description}
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Industry", value: startup.industry },
                { label: "Stage", value: startup.stage },
                { label: "Status", value: startup.verificationStatus },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Mission</CardDescription>
            <CardTitle>Why this startup exists</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              This space can highlight the founder&apos;s mission, the problem they
              are solving, and the traction narrative that makes the company
              worth backing.
            </p>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-4">
          <Button asChild className="bg-zinc-200 text-zinc-950 hover:bg-zinc-300 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200">
            <Link href="/investor/startups">Back to directory</Link>
          </Button>

          <Badge>VERIFIED</Badge>
        </div>
      </section>

      <aside className="space-y-6">
        <Card>
          <CardHeader>
            <CardDescription>Investment Action</CardDescription>
            <CardTitle>Funding Goal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Funding Goal
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                  NGN {startup.fundingRequired.toLocaleString()}
                </p>
              </div>

              <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Equity Offered
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                  {startup.equityOffered}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Founder wallet
                </p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {startup.founder.founderWalletAddress
                    ? "Escrow can route directly to the founder."
                    : "Wallet not linked yet. Funding will stay in pending deposit until it is added."}
                </p>
              </div>

              <Badge
                className={
                  startup.founder.founderWalletAddress
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                }
              >
                {startup.founder.founderWalletAddress ? "Linked" : "Missing"}
              </Badge>
            </div>

            <InvestNowForm
              startupId={startup.id}
              fundingRequired={startup.fundingRequired}
              founderAddress={startup.founder.founderWalletAddress}
              milestoneAuthorityAddress={process.env.NEXT_PUBLIC_ESCROW_MILESTONE_AUTHORITY ?? null}
            />
          </CardContent>
        </Card>

        <ConnectionRequestCard
          startupId={startup.id}
          startupName={startup.name}
          conversationId={existingConversation?.id ?? null}
          conversationStatus={existingConversation?.status ?? null}
        />
      </aside>
    </div>
  );
}
