"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

import { updateFounderWalletAddress } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

type FounderWalletFormProps = {
  currentWalletAddress: string | null;
};

export function FounderWalletForm({
  currentWalletAddress,
}: FounderWalletFormProps) {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const [walletAddress, setWalletAddress] = React.useState(
    currentWalletAddress ?? "",
  );
  const [isPending, startTransition] = React.useTransition();

  function fillFromConnectedWallet() {
    if (!publicKey) {
      toast({
        title: "Connect a wallet first",
        description: "Use your connected Solana wallet to populate your founder wallet automatically.",
        variant: "destructive",
      });
      return;
    }

    setWalletAddress(publicKey.toBase58());
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      updateFounderWalletAddress(formData)
        .then(() => {
          toast({
            title: "Wallet address saved",
            description: "Investors can now route escrow funds to your founder wallet.",
          });
          router.refresh();
        })
        .catch((error) => {
          toast({
            title: "Could not save wallet address",
            description: error instanceof Error ? error.message : "Please try again.",
            variant: "destructive",
          });
        });
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label
          htmlFor="founderWalletAddress"
          className="text-sm font-medium text-[color:var(--foreground)]"
        >
          Founder wallet address
        </label>
        <Input
          id="founderWalletAddress"
          name="founderWalletAddress"
          value={walletAddress}
          onChange={(event) => setWalletAddress(event.target.value)}
          placeholder="Enter your Solana public key"
          className="h-11"
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          onClick={fillFromConnectedWallet}
          disabled={!connected && !publicKey}
          className="border border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--foreground)] hover:bg-[color:var(--surface)]"
        >
          Use connected wallet
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save founder wallet"}
        </Button>
      </div>
    </form>
  );
}
