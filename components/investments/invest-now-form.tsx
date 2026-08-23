"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  createInvestment,
  finalizeInvestmentFunding,
} from "@/app/actions/startup";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useEscrow } from "@/hooks/use-escrow";
import { estimateSolFromNgn, ngnToLamports } from "@/lib/funding";

type InvestNowFormProps = {
  startupId: string;
  fundingRequired: number;
  founderAddress?: string | null;
  milestoneAuthorityAddress?: string | null;
};

export function InvestNowForm({
  startupId,
  fundingRequired,
  founderAddress,
  milestoneAuthorityAddress,
}: InvestNowFormProps) {
  const router = useRouter();
  const [amount, setAmount] = React.useState(String(fundingRequired));
  const [isLoading, setIsLoading] = React.useState(false);
  const { connected, publicKey, deposit, isPending: isEscrowPending } = useEscrow();
  const amountNgn = Number(amount);
  const estimatedSol = estimateSolFromNgn(amountNgn);
  const canFund = connected && !isEscrowPending && !isLoading;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      if (!connected || !publicKey) {
        throw new Error("Connect your wallet to fund this startup.");
      }

      const amountLamports = ngnToLamports(amountNgn);
      const investment = await createInvestment(startupId, amountNgn, publicKey.toBase58());

      if (!founderAddress || !milestoneAuthorityAddress) {
        toast({
          title: "Investment created",
          description:
            "The record is now pending deposit. Link the founder wallet to complete the escrow flow.",
        });
        router.refresh();
        return;
      }

      const escrowResult = await deposit({
        investmentId: investment.id,
        amount: amountLamports,
        founderAddress,
        milestoneAuthorityAddress,
      });

      await finalizeInvestmentFunding({
        investmentId: investment.id,
        escrowAddress: escrowResult.escrowAddress,
        investorWalletAddress: publicKey.toBase58(),
        creditedLamports: amountLamports.toString(),
        founderWalletAddress: founderAddress,
        milestoneAuthorityAddress,
      });

      toast({
        title: "Investment funded",
        description:
          estimatedSol
            ? `The investment record was created and ${estimatedSol} was signed into escrow successfully.`
            : "The investment record was created and the escrow flow was started successfully.",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Funding failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      className="space-y-4 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800"
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-950 dark:text-zinc-50" htmlFor="amount">
          Investment amount (USD)
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          min="1"
          step="0.01"
          required
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="h-11 w-full rounded-md border border-zinc-300 bg-transparent px-3 text-sm outline-none transition focus:border-zinc-950 dark:border-zinc-700 dark:focus:border-zinc-50"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Estimated on-chain value:{" "}
          {estimatedSol ?? "Enter a valid amount to preview the SOL equivalent."}
        </p>
      </div>

      {!connected ? (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Connect your wallet to sign the escrow transaction.
        </p>
      ) : null}

      <Button type="submit" disabled={!canFund} className="w-full">
        {isLoading || isEscrowPending ? "Funding..." : "Fund"}
      </Button>
    </form>
  );
}
