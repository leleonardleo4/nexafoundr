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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { useEscrow } from "@/hooks/use-escrow";

type Milestone = {
  id: string;
  title: string;
  description: string | null;
  amountLamports: string;
  status: string;
  dueDate: Date | string | null;
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
        <CardTitle>Milestone approvals</CardTitle>
        <CardDescription>
          Approve milestone releases from the deployed Devnet escrow program.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {milestones.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Milestone</TableHead>
                <TableHead>Release</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {milestones.map((milestone) => {
                const rowPending =
                  isPending && pendingMilestoneId === milestone.id;
                const canApprove = milestone.status !== "RELEASED";

                return (
                  <TableRow key={milestone.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{milestone.title}</p>
                        {milestone.description ? (
                          <p className="text-xs text-zinc-500">
                            {milestone.description}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{formatLamports(milestone.amountLamports)}</TableCell>
                    <TableCell>
                      <Badge>{milestone.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        disabled={!connected || rowPending || !canApprove}
                        onClick={() => handleApprove(milestone)}
                      >
                        {rowPending ? "Approving..." : "Approve"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
