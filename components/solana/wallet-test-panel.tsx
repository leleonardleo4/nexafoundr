"use client";

import * as React from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import type { Wallet } from "@coral-xyz/anchor/dist/esm/provider";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import {
  INVESTMENT_ESCROW_PROGRAM_ID,
  createInvestmentEscrowProgram,
} from "@/lib/anchor-client";

const TEST_RECIPIENT_ADDRESS = "HfCAZbYdhJqg5bbccTeJLT93krNbPY6zggsErEGAtnqw";
const TEST_TRANSFER_LAMPORTS = 1;

function formatSol(balance: number | null) {
  if (balance === null) {
    return "Connect wallet to load balance";
  }

  return `${(balance / LAMPORTS_PER_SOL).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  })} SOL`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong while talking to Phantom.";
}

export function WalletTestPanel() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [balance, setBalance] = React.useState<number | null>(null);
  const [isFetchingBalance, setIsFetchingBalance] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);

  const walletReady =
    wallet.connected &&
    wallet.publicKey &&
    wallet.signTransaction &&
    wallet.signAllTransactions;

  const refreshBalance = React.useCallback(async () => {
    if (!wallet.publicKey) {
      setBalance(null);
      return;
    }

    setIsFetchingBalance(true);

    try {
      const nextBalance = await connection.getBalance(wallet.publicKey);
      setBalance(nextBalance);
    } catch (error) {
      toast({
        title: "Could not load wallet balance",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsFetchingBalance(false);
    }
  }, [connection, toast, wallet.publicKey]);

  React.useEffect(() => {
    void refreshBalance();
  }, [refreshBalance]);

  const sendTestTransaction = async () => {
    const { publicKey, signTransaction, signAllTransactions } = wallet;

    if (!walletReady || !publicKey || !signTransaction || !signAllTransactions) {
      toast({
        title: "Connect Phantom first",
        description: "Your wallet must be connected before sending a test transaction.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const anchorWallet: Wallet = {
        publicKey,
        signTransaction,
        signAllTransactions,
      };

      createInvestmentEscrowProgram(connection, anchorWallet);

      const latestBlockhash = await connection.getLatestBlockhash("confirmed");
      const transaction = new Transaction({
        feePayer: publicKey,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      }).add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(TEST_RECIPIENT_ADDRESS),
          lamports: TEST_TRANSFER_LAMPORTS,
        }),
      );

      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(
        {
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        "confirmed",
      );

      await refreshBalance();

      toast({
        title: "Test transaction sent",
        description: `Signature: ${signature.slice(0, 12)}...${signature.slice(-8)}`,
      });
    } catch (error) {
      toast({
        title: "Transaction failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solana connection test</CardTitle>
        <CardDescription>
          Read your Phantom balance and send a 1-lamport devnet test transfer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="font-medium text-zinc-950 dark:text-zinc-50">
            Wallet balance
          </p>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            {isFetchingBalance ? "Loading..." : formatSol(balance)}
          </p>
          <p className="mt-3 break-all text-xs text-zinc-500">
            Escrow program: {INVESTMENT_ESCROW_PROGRAM_ID}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            onClick={refreshBalance}
            disabled={!wallet.publicKey || isFetchingBalance}
            className="border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            {isFetchingBalance ? "Refreshing..." : "Refresh balance"}
          </Button>
          <Button
            type="button"
            onClick={sendTestTransaction}
            disabled={!walletReady || isSending}
          >
            {isSending ? "Waiting for signature..." : "Send test transaction"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
