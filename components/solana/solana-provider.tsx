"use client";

import * as React from "react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

import "@solana/wallet-adapter-react-ui/styles.css";

type SolanaProviderProps = {
  children: React.ReactNode;
};

export function SolanaProvider({ children }: SolanaProviderProps) {
  const endpoint = React.useMemo(
    () => {
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
    },
    [],
  );
  const wallets = React.useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
