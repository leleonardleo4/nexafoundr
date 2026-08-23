"use client";

import * as React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { CheckCircle2, Clock3, RefreshCcw, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type DemoDayChecklistSnapshot = {
  startupFound: boolean;
  funded: boolean;
  milestoneApproved: boolean;
  checkedAt: string;
  activeInvestment: {
    id: string;
    startupName: string;
    status: string;
    amount: number;
    escrowAddress: string | null;
    releasedAmountLamports: number | null;
    milestoneStatus: string | null;
  } | null;
};

type DemoDayChecklistProps = {
  investmentId?: string | null;
};

type ChecklistStep = {
  title: string;
  complete: boolean;
  detail: string;
};

function formatCheckedAt(value: string | null) {
  if (!value) {
    return "Not checked yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not checked yet";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function DemoDayChecklist({ investmentId }: DemoDayChecklistProps) {
  const { connected, publicKey } = useWallet();
  const [snapshot, setSnapshot] = React.useState<DemoDayChecklistSnapshot | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadChecklist = React.useCallback(async () => {
    setIsLoading(true);

    try {
      const targetUrl = new URL("/api/demo-day/checklist", window.location.origin);

      if (investmentId) {
        targetUrl.searchParams.set("investmentId", investmentId);
      }

      const response = await fetch(targetUrl.toString(), {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load the live checklist.");
      }

      const data = (await response.json()) as DemoDayChecklistSnapshot;
      setSnapshot(data);
      setError(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load the live checklist.",
      );
      setSnapshot(null);
    } finally {
      setIsLoading(false);
    }
  }, [investmentId]);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadChecklist();
    }, 0);

    const interval = window.setInterval(() => {
      void loadChecklist();
    }, 15000);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [loadChecklist]);

  const walletConnected = connected && Boolean(publicKey);
  const steps: ChecklistStep[] = [
    {
      title: "Wallet Connected",
      complete: walletConnected,
        detail: walletConnected
          ? `Connected as ${publicKey?.toBase58()}`
        : "Connect your wallet to reflect live wallet state.",
    },
    {
      title: "Startup Found",
      complete: snapshot?.startupFound ?? false,
      detail: snapshot?.activeInvestment
        ? `Active record: ${snapshot.activeInvestment.startupName}`
        : "No investment row found for the current investor.",
    },
    {
      title: "Funded",
      complete: snapshot?.funded ?? false,
      detail: snapshot?.activeInvestment
        ? `Investment status: ${snapshot.activeInvestment.status}`
        : "The investment table does not yet show a funded record.",
    },
    {
      title: "Milestone Approved",
      complete: snapshot?.milestoneApproved ?? false,
      detail: snapshot?.activeInvestment
        ? snapshot.activeInvestment.milestoneStatus
          ? `Escrow status: ${snapshot.activeInvestment.milestoneStatus}`
          : "No released escrow account has been detected yet."
        : "No escrow account is available for milestone release checks.",
    },
  ];

  const completedCount = steps.filter((step) => step.complete).length;

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardDescription>Investor readiness</CardDescription>
            <CardTitle className="mt-1">Live funding checklist</CardTitle>
          </div>

          <Badge className="border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            {completedCount}/4 complete
          </Badge>
        </div>

        <p className="max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          This checklist is driven by the live wallet, database, and escrow account
          state so the funding flow stays in sync with the real system.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                Live wallet state
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {walletConnected
                  ? `Connected as ${publicKey?.toBase58()}`
                  : "Wallet disconnected"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isLoading ? (
              <span className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <Clock3 className="h-4 w-4 animate-pulse" />
                Checking live state
              </span>
            ) : (
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Last checked {formatCheckedAt(snapshot?.checkedAt ?? null)}
              </span>
            )}

            <Button
              type="button"
              onClick={() => {
                void loadChecklist();
              }}
              className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <div className="grid gap-3">
          {steps.map((step) => (
            <div
              key={step.title}
              className={[
                "flex flex-col gap-3 rounded-2xl border p-4 transition-colors sm:flex-row sm:items-start sm:justify-between",
                step.complete
                  ? "border-violet-200 bg-violet-50/80 dark:border-violet-900 dark:bg-violet-950/30"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/50",
              ].join(" ")}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {step.title}
                  </h3>
                  {step.complete ? (
                    <Badge className="border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-900 dark:bg-violet-950/60 dark:text-violet-300">
                      Complete
                    </Badge>
                  ) : (
                    <Badge className="border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                      Pending
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{step.detail}</p>
              </div>

              <div className="flex items-center gap-2 text-sm font-medium">
                {step.complete ? (
                  <CheckCircle2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                ) : (
                  <span className="inline-flex h-4 w-4 rounded-full border border-zinc-300 dark:border-zinc-700" />
                )}
              </div>
            </div>
          ))}
        </div>

        {snapshot?.activeInvestment ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950/50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-zinc-950 dark:text-zinc-50">
                  Active investment
                </p>
                <p className="text-zinc-500 dark:text-zinc-400">
                  {snapshot.activeInvestment.startupName} | {snapshot.activeInvestment.status}
                </p>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400">
                Escrow:{" "}
                {snapshot.activeInvestment.escrowAddress ?? "Not yet initialized"}
              </p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
