"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useEscrow } from "@/hooks/use-escrow";
import { estimateSolFromNgn, ngnToLamports } from "@/lib/funding";

type FundingButtonProps = {
  investmentId: string;
  amount: number | string | bigint;
  founderAddress: string;
  milestoneAuthorityAddress?: string;
  className?: string;
};

const configuredMilestoneAuthority =
  process.env.NEXT_PUBLIC_ESCROW_MILESTONE_AUTHORITY?.trim();

export function FundingButton({
  investmentId,
  amount,
  founderAddress,
  milestoneAuthorityAddress = configuredMilestoneAuthority,
  className,
}: FundingButtonProps) {
  const { connected, deposit, isPending } = useEscrow();
  const estimatedSol = estimateSolFromNgn(amount);

  async function handleFund() {
    if (!milestoneAuthorityAddress) {
      toast({
        title: "Missing milestone authority",
        description:
          "Set NEXT_PUBLIC_ESCROW_MILESTONE_AUTHORITY or pass milestoneAuthorityAddress.",
        variant: "destructive",
      });
      return;
    }

    try {
      const amountLamports = ngnToLamports(amount);
      const result = await deposit({
        investmentId,
        amount: amountLamports,
        founderAddress,
        milestoneAuthorityAddress,
      });

      toast({
        title: "Funds locked in escrow",
        description: estimatedSol
          ? `Signature: ${result.signature.slice(0, 12)}...${result.signature.slice(-8)}. Estimated transfer: ${estimatedSol}.`
          : `Signature: ${result.signature.slice(0, 12)}...${result.signature.slice(-8)}`,
      });
    } catch (error) {
      toast({
        title: "Funding failed",
        description:
          error instanceof Error
            ? error.message
            : "Unable to lock funds in escrow.",
        variant: "destructive",
      });
    }
  }

  return (
    <Button
      type="button"
      className={className}
      disabled={!connected || isPending}
      onClick={handleFund}
    >
      {isPending ? "Funding..." : connected ? "Fund" : "Connect wallet"}
    </Button>
  );
}
