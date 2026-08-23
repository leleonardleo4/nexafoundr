"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useEscrow } from "@/hooks/use-escrow";

type Milestone = {
  id: string;
  title: string;
  description: string | null;
  amountLamports: string;
  status: string;
  dueDate: Date | string | null;
  approvedAt?: Date | string | null;
  releasedAt?: Date | string | null;
};

type MilestoneApprovalListProps = {
  investmentId: string;
  founderAddress: string | null;
  investorWalletAddress: string | null;
  escrowAddress: string | null;
  milestones: Milestone[];
};

function formatLamports(value: string) {
  const lamports = Number(value);

  if (!Number.isFinite(lamports)) {
    return `${value} lamports`;
  }

  return `${(lamports / 1_000_000_000).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  })} SOL`;
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
}

function getStatusTone(status: string) {
  switch (status) {
    case "APPROVED":
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300";
    case "RELEASED":
      return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
  }
}

export function MilestoneApprovalList({
  investmentId,
  founderAddress,
  investorWalletAddress,
  escrowAddress,
  milestones,
}: MilestoneApprovalListProps) {
  const { connected, isPending, releaseMilestone } = useEscrow();
  const [pendingMilestoneId, setPendingMilestoneId] = React.useState<string | null>(
    null,
  );

  async function handleApprove(milestone: Milestone) {
    if (!founderAddress) {
      toast({
        title: "Missing founder wallet",
        description: "Add founderWalletAddress to this investment before releasing funds.",
        variant: "destructive",
      });
      return;
    }

    if (!escrowAddress && !investorWalletAddress) {
      toast({
        title: "Missing escrow metadata",
        description:
          "Provide escrowAddress or investorWalletAddress so the escrow PDA can be resolved.",
        variant: "destructive",
      });
      return;
    }

    setPendingMilestoneId(milestone.id);

    try {
      const result = await releaseMilestone({
        founderAddress,
        releaseAmount: milestone.amountLamports,
        escrowAddress: escrowAddress ?? undefined,
        investmentId,
        investorAddress: investorWalletAddress ?? undefined,
      });

      toast({
        title: "Milestone approved",
        description: `Released from escrow. Signature: ${result.signature.slice(0, 12)}...${result.signature.slice(-8)}`,
      });
    } catch (error) {
      toast({
        title: "Milestone approval failed",
        description:
          error instanceof Error
            ? error.message
            : "Unable to release milestone funds.",
        variant: "destructive",
      });
    } finally {
      setPendingMilestoneId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Milestone approval</CardTitle>
        <CardDescription>
          Review each milestone status and release funds when the delivery is ready.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {milestones.length > 0 ? (
          <div className="space-y-4">
            {milestones.map((milestone) => {
              const rowPending = isPending && pendingMilestoneId === milestone.id;
              const canApprove = milestone.status !== "RELEASED";
              const dueDate = formatDate(milestone.dueDate);
              const approvedAt = formatDate(milestone.approvedAt);
              const releasedAt = formatDate(milestone.releasedAt);

              return (
                <div
                  key={milestone.id}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/40"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                          {milestone.title}
                        </h4>
                        <Badge className={getStatusTone(milestone.status)}>
                          {milestone.status}
                        </Badge>
                      </div>

                      {milestone.description ? (
                        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
                          {milestone.description}
                        </p>
                      ) : null}

                      <div className="flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                        <span>Release: {formatLamports(milestone.amountLamports)}</span>
                        {dueDate ? <span>Due: {dueDate}</span> : null}
                        {approvedAt ? <span>Approved: {approvedAt}</span> : null}
                        {releasedAt ? <span>Released: {releasedAt}</span> : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        disabled={!connected || isPending || !canApprove}
                        onClick={() => handleApprove(milestone)}
                        className="whitespace-nowrap"
                      >
                        {rowPending ? "Approving..." : "Approve"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-500">
              No milestones have been added for this investment yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
