import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getVerifiedStartups } from "@/app/actions/startup";
import { StartupMarketplace } from "@/components/investor/startup-marketplace";
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

export default async function InvestorStartupsPage() {
  const user = await getInvestorUser();
  const [startups, savedStartups] = await Promise.all([
    getVerifiedStartups(),
    prisma.savedStartup.findMany({
      where: {
        investorId: user.id,
      },
      select: {
        startupId: true,
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
        <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
          Startup marketplace
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
          Explore verified startups
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Search by name or industry, compare funding goals, and open a full
          startup profile before you invest.
        </p>
      </section>

      <StartupMarketplace
        startups={startups}
        savedStartupIds={savedStartups.map((savedStartup) => savedStartup.startupId)}
      />
    </div>
  );
}
