"use client";

import * as React from "react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

import "@solana/wallet-adapter-react-ui/styles.css";
import { getSolanaRpcEndpoint } from "@/lib/solana-endpoint";

type SolanaProviderProps = {
  children: React.ReactNode;
};

export function SolanaProvider({ children }: SolanaProviderProps) {
  const endpoint = React.useMemo(
    () => getSolanaRpcEndpoint(),
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
