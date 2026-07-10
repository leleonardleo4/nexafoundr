import { clusterApiUrl } from "@solana/web3.js";

export function getSolanaRpcEndpoint() {
  const configuredEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();

  if (configuredEndpoint) {
    return configuredEndpoint;
  }

  return clusterApiUrl(
    process.env.NEXT_PUBLIC_SOLANA_CLUSTER === "mainnet-beta"
      ? "mainnet-beta"
      : process.env.NEXT_PUBLIC_SOLANA_CLUSTER === "testnet"
        ? "testnet"
        : "devnet",
  );
}
