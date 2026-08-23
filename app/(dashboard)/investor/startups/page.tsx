import { getVerifiedStartups } from "@/app/actions/startup";
import { StartupMarketplace } from "@/components/investor/startup-marketplace";
import { requireDashboardSessionUser } from "@/lib/dashboard-session";
import { prisma } from "@/lib/prisma";

export default async function InvestorStartupsPage() {
  const user = await requireDashboardSessionUser("INVESTOR");
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
      <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
          Startup marketplace
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[color:var(--foreground)]">
          Explore verified startups
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[color:var(--muted-foreground)]">
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
