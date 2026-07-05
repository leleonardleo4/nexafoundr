"use client";

import * as React from "react";

import { createInvestment } from "@/app/actions/startup";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

type InvestNowFormProps = {
  startupId: string;
  fundingRequired: number;
};

export function InvestNowForm({ startupId, fundingRequired }: InvestNowFormProps) {
  const [amount, setAmount] = React.useState(String(fundingRequired));
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    startTransition(() => {
      createInvestment(startupId, Number(amount))
        .then(() => {
          toast({
            title: "Investment started",
            description: "Your investment record was created with PENDING status.",
          });
        })
        .catch((error) => {
          toast({
            title: "Investment failed",
            description: error instanceof Error ? error.message : "Please try again.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    });
  }

  return (
    <form className="space-y-4 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-950 dark:text-zinc-50" htmlFor="amount">
          Investment amount
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
      </div>

      <Button type="submit" disabled={isLoading || isPending} className="w-full">
        {isLoading || isPending ? "Submitting..." : "Invest Now"}
      </Button>
    </form>
  );
}
