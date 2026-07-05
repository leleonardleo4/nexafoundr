"use client";

import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import type { Wallet } from "@coral-xyz/anchor/dist/esm/provider";
import type { Connection } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

import investmentEscrowIdl from "@/anchor/target/idl/investment_escrow.json";

export const INVESTMENT_ESCROW_PROGRAM_ID =
  "HfCAZbYdhJqg5bbccTeJLT93krNbPY6zggsErEGAtnqw";

export function createAnchorProvider(connection: Connection, wallet: Wallet) {
  return new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
}

export function createInvestmentEscrowProgram(
  connection: Connection,
  wallet: Wallet,
) {
  const provider = createAnchorProvider(connection, wallet);
  const idl = {
    ...investmentEscrowIdl,
    address: INVESTMENT_ESCROW_PROGRAM_ID,
  } as Idl & { address: string };

  return new Program(idl, provider);
}

export function getInvestmentEscrowProgramId() {
  return new PublicKey(INVESTMENT_ESCROW_PROGRAM_ID);
}
