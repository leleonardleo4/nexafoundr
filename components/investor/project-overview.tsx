import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TransactionHistory } from "@/components/solana/transaction-history";
import { estimateSolFromNgn } from "@/lib/funding";

type ProjectOverviewInvestment = {
  id: string;
  amount: number;
  status: string;
  escrowAddress: string | null;
  investorWalletAddress: string | null;
  startup: {
    name: string;
    industry: string;
    stage: string;
    fundingRequired: number;
  };
};

type ProjectOverviewProps = {
  investment: ProjectOverviewInvestment;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getProgress(amount: number, target: number) {
  if (!Number.isFinite(target) || target <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((amount / target) * 100));
}

function getStatusTone(status: string) {
  switch (status) {
    case "FUNDED":
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300";
    case "RELEASED":
      return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300";
    case "PENDING_DEPOSIT":
    default:
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
  }
}

export function ProjectOverview({ investment }: ProjectOverviewProps) {
  const progress = getProgress(investment.amount, investment.startup.fundingRequired);
  const fundingGap = Math.max(investment.startup.fundingRequired - investment.amount, 0);
  const committedSol = estimateSolFromNgn(investment.amount);
  const gapSol = estimateSolFromNgn(fundingGap);

  return (
    <section className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardDescription>Project overview</CardDescription>
              <CardTitle className="mt-1 text-2xl">{investment.startup.name}</CardTitle>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {investment.startup.industry} | {investment.startup.stage}
              </p>
            </div>

            <Badge className={getStatusTone(investment.status)}>
              {investment.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Funding progress
              </span>
              <span className="text-zinc-500 dark:text-zinc-400">{progress}%</span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-400 to-fuchsia-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Committed
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                  {formatCurrency(investment.amount)}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {committedSol ? `Estimated on-chain value: ${committedSol}` : null}
                </p>
              </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Target
              </p>
              <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                {formatCurrency(investment.startup.fundingRequired)}
              </p>
            </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Remaining
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                  {formatCurrency(fundingGap)}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {gapSol ? `Estimated on-chain value: ${gapSol}` : null}
                </p>
              </div>
            </div>
        </CardContent>
      </Card>

      <TransactionHistory
        investmentId={investment.id}
        investorWalletAddress={investment.investorWalletAddress}
        escrowAddress={investment.escrowAddress}
      />
    </section>
  );
}
