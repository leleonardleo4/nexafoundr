import { PublicKey } from "@solana/web3.js";

export const INVESTMENT_ESCROW_PROGRAM_ID =
  "HfCAZbYdhJqg5bbccTeJLT93krNbPY6zggsErEGAtnqw";

export function getInvestmentEscrowProgramId() {
  return new PublicKey(INVESTMENT_ESCROW_PROGRAM_ID);
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
