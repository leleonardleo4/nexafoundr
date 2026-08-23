"use client";

import * as React from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { getSolanaRpcEndpoint } from "@/lib/solana-endpoint";

type SolanaProviderProps = {
  children: React.ReactNode;
};

export function SolanaProvider({ children }: SolanaProviderProps) {
  const endpoint = React.useMemo(
    () => getSolanaRpcEndpoint(),
    [],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]}> 
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
