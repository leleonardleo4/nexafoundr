"use client";

import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton,
    ),
  {
    ssr: false,
    loading: () => (
      <button
        type="button"
        className="wallet-adapter-button wallet-adapter-button-trigger inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        aria-label="Connect Wallet"
        disabled
      >
        Connect Wallet
      </button>
    ),
  },
);

export function WalletConnectButton() {
  return <WalletMultiButton />;
}
