"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { PrivyProvider } from "@/components/providers/privy-provider";
import { SolanaProvider } from "@/components/solana/solana-provider";

export function PrivyAppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute =
    pathname === "/login" || pathname === "/signup" || pathname.startsWith("/wallet-connect");

  return (
    <PrivyProvider>
      {isAuthRoute ? children : <SolanaProvider>{children}</SolanaProvider>}
    </PrivyProvider>
  );
}
