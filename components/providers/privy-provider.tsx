"use client";

import type { ReactNode } from "react";
import { PrivyProvider as ReactPrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true,
});

export function PrivyProvider({ children }: { children: ReactNode }) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!privyAppId) {
    console.warn(
      "NEXT_PUBLIC_PRIVY_APP_ID environment variable is not set. Add it to your .env file.",
    );
    return <>{children}</>;
  }

  return (
    <ReactPrivyProvider
      appId={privyAppId}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#0f766e",
          walletChainType: "solana-only",
          walletList: ["phantom"],
        },
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
        embeddedWallets: {
          solana: {
            createOnLogin: "users-without-wallets",
          },
        },
        loginMethods: ["wallet", "twitter"],
      }}
    >
      {children}
    </ReactPrivyProvider>
  );
}
