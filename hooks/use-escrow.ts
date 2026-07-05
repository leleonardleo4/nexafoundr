"use client";

import * as React from "react";
import { BN } from "@coral-xyz/anchor";
import type { Wallet } from "@coral-xyz/anchor/dist/esm/provider";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

import {
  createInvestmentEscrowProgram,
  getInvestmentEscrowProgramId,
} from "@/lib/anchor-client";

type EscrowAmount = number | string | bigint;

type DepositInput = {
  investmentId: string;
  amount: EscrowAmount;
  founderAddress: string;
  milestoneAuthorityAddress: string;
};

type ReleaseMilestoneInput = {
  founderAddress: string;
  releaseAmount: EscrowAmount;
  escrowAddress?: string;
  investmentId?: string;
  investorAddress?: string;
};

type AnchorMethod = (...args: unknown[]) => {
  accountsPartial(accounts: Record<string, unknown>): {
    rpc(): Promise<string>;
  };
};

function getEscrowErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("insufficient") || message.includes("0x1")) {
      return "Insufficient SOL to complete this escrow transaction.";
    }

    if (message.includes("user rejected") || message.includes("rejected")) {
      return "Transaction was rejected in your wallet.";
    }

    return error.message;
  }

  return "Escrow transaction failed.";
}

function toLamportsBn(amount: EscrowAmount) {
  if (typeof amount === "bigint") {
    if (amount <= BigInt(0)) {
      throw new Error("Amount must be greater than zero.");
    }

    return new BN(amount.toString());
  }

  const amountString = String(amount).trim();

  if (!/^\d+$/.test(amountString) || BigInt(amountString) <= BigInt(0)) {
    throw new Error("Amount must be a positive lamport integer.");
  }

  return new BN(amountString);
}

function toPublicKey(value: string, label: string) {
  try {
    return new PublicKey(value);
  } catch {
    throw new Error(`${label} must be a valid Solana public key.`);
  }
}

function resolveMethod(methods: unknown, ...names: string[]) {
  const methodMap = methods as Record<string, AnchorMethod | undefined>;
  const method = names.map((name) => methodMap[name]).find(Boolean);

  if (!method) {
    throw new Error(`Escrow method ${names.join(" / ")} was not found in the IDL.`);
  }

  return method;
}

export function getEscrowPda(investor: PublicKey, investmentId: string) {
  return PublicKey.findProgramAddressSync(
    [
      new TextEncoder().encode("escrow"),
      investor.toBuffer(),
      new TextEncoder().encode(investmentId),
    ],
    getInvestmentEscrowProgramId(),
  );
}

export function useEscrow() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const getProgram = React.useCallback(() => {
    const { publicKey, signTransaction, signAllTransactions } = wallet;

    if (!publicKey || !signTransaction || !signAllTransactions) {
      throw new Error("Connect Phantom before using escrow.");
    }

    const anchorWallet: Wallet = {
      publicKey,
      signTransaction,
      signAllTransactions,
    };

    return createInvestmentEscrowProgram(connection, anchorWallet);
  }, [connection, wallet]);

  const deposit = React.useCallback(
    async ({
      investmentId,
      amount,
      founderAddress,
      milestoneAuthorityAddress,
    }: DepositInput) => {
      setIsPending(true);
      setError(null);

      try {
        if (!wallet.publicKey) {
          throw new Error("Connect Phantom before funding this investment.");
        }

        if (!investmentId.trim()) {
          throw new Error("Investment ID is required.");
        }

        const founder = toPublicKey(founderAddress, "Founder address");
        const milestoneAuthority = toPublicKey(
          milestoneAuthorityAddress,
          "Milestone authority address",
        );
        const [escrow] = getEscrowPda(wallet.publicKey, investmentId);
        const program = getProgram();
        const initializeEscrow = resolveMethod(
          program.methods,
          "initializeEscrow",
          "initialize_escrow",
        );

        const signature = await initializeEscrow(
          investmentId,
          toLamportsBn(amount),
        )
          .accountsPartial({
            investor: wallet.publicKey,
            founder,
            milestoneAuthority,
            escrow,
          })
          .rpc();

        return {
          signature,
          escrowAddress: escrow.toBase58(),
        };
      } catch (caughtError) {
        const message = getEscrowErrorMessage(caughtError);
        setError(message);
        throw new Error(message);
      } finally {
        setIsPending(false);
      }
    },
    [getProgram, wallet.publicKey],
  );

  const releaseMilestone = React.useCallback(
    async ({
      founderAddress,
      releaseAmount,
      escrowAddress,
      investmentId,
      investorAddress,
    }: ReleaseMilestoneInput) => {
      setIsPending(true);
      setError(null);

      try {
        if (!wallet.publicKey) {
          throw new Error("Connect the milestone authority wallet first.");
        }

        const founder = toPublicKey(founderAddress, "Founder address");
        const escrow = escrowAddress
          ? toPublicKey(escrowAddress, "Escrow address")
          : investmentId && investorAddress
            ? getEscrowPda(
                toPublicKey(investorAddress, "Investor address"),
                investmentId,
              )[0]
            : null;

        if (!escrow) {
          throw new Error(
            "Provide either escrowAddress or both investmentId and investorAddress.",
          );
        }

        const program = getProgram();
        const releaseMilestoneFunds = resolveMethod(
          program.methods,
          "releaseMilestoneFunds",
          "release_milestone_funds",
        );

        const signature = await releaseMilestoneFunds(toLamportsBn(releaseAmount))
          .accountsPartial({
            milestoneAuthority: wallet.publicKey,
            founder,
            escrow,
          })
          .rpc();

        return {
          signature,
          escrowAddress: escrow.toBase58(),
        };
      } catch (caughtError) {
        const message = getEscrowErrorMessage(caughtError);
        setError(message);
        throw new Error(message);
      } finally {
        setIsPending(false);
      }
    },
    [getProgram, wallet.publicKey],
  );

  return {
    connected: wallet.connected,
    error,
    isPending,
    publicKey: wallet.publicKey,
    deposit,
    releaseMilestone,
  };
}
