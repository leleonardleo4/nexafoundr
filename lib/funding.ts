import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const DEFAULT_NGN_PER_SOL = 1_000_000;

function getConfiguredNgnPerSol() {
  const rawValue = process.env.NEXT_PUBLIC_NGN_PER_SOL?.trim();

  if (!rawValue) {
    return DEFAULT_NGN_PER_SOL;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return DEFAULT_NGN_PER_SOL;
  }

  return parsedValue;
}

export function ngnToLamports(amountNgn: number | string | bigint) {
  const numericAmount =
    typeof amountNgn === "bigint" ? Number(amountNgn) : Number(amountNgn);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Investment amount must be a positive number.");
  }

  const estimatedSol = numericAmount / getConfiguredNgnPerSol();
  const lamports = Math.max(1, Math.round(estimatedSol * LAMPORTS_PER_SOL));

  return BigInt(lamports);
}

export function formatSolAmount(lamports: number | string | bigint) {
  const numericLamports =
    typeof lamports === "bigint" ? Number(lamports) : Number(lamports);

  if (!Number.isFinite(numericLamports) || numericLamports < 0) {
    return "0 SOL";
  }

  return `${(numericLamports / LAMPORTS_PER_SOL).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  })} SOL`;
}

export function estimateSolFromNgn(amountNgn: number | string | bigint) {
  try {
    return formatSolAmount(ngnToLamports(amountNgn));
  } catch {
    return null;
  }
}
