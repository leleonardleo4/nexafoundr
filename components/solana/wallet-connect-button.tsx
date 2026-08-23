"use client";

import * as React from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong while connecting your wallet.";
}

type WalletStatus = "detecting" | "phantom" | "conflict" | "none";
type PhantomInstallState = "idle" | "install-opened" | "detected" | "connected";
const PHANTOM_DOWNLOAD_URL = "https://phantom.com/download";
const PHANTOM_INSTALL_STATE_STORAGE_KEY = "nexafoundr:phantom-install-state";
const PHANTOM_INSTALL_STATE_CHANGE_EVENT = "nexafoundr:phantom-install-state-change";

function readPhantomProvider() {
  if (typeof window === "undefined") {
    return null;
  }

  const phantom = (window as Window & {
    phantom?: { solana?: { isPhantom?: boolean } };
    solana?: { isPhantom?: boolean };
  }).phantom?.solana;

  const legacySolana = (window as Window & {
    solana?: { isPhantom?: boolean };
  }).solana;

  if (phantom?.isPhantom) {
    return phantom;
  }

  if (legacySolana?.isPhantom) {
    return legacySolana;
  }

  return null;
}

function readWalletStatus(): WalletStatus {
  if (typeof window === "undefined") {
    return "detecting";
  }

  const phantomProvider = readPhantomProvider();
  if (phantomProvider) {
    return "phantom";
  }

  const ethereumProviders = (window as Window & {
    ethereum?: { providers?: unknown[] };
  }).ethereum?.providers;

  if ((window as Window & { ethereum?: unknown }).ethereum || ethereumProviders) {
    return "conflict";
  }

  return "none";
}

function readPhantomInstallStateSnapshot() {
  if (typeof window === "undefined") {
    return "idle" as PhantomInstallState;
  }

  const storedState = window.localStorage.getItem(PHANTOM_INSTALL_STATE_STORAGE_KEY);

  if (
    storedState === "install-opened" ||
    storedState === "detected" ||
    storedState === "connected"
  ) {
    return storedState;
  }

  return "idle";
}

function subscribeToPhantomInstallStateChange(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(PHANTOM_INSTALL_STATE_CHANGE_EVENT, handler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(PHANTOM_INSTALL_STATE_CHANGE_EVENT, handler);
  };
}

function setPhantomInstallState(state: PhantomInstallState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PHANTOM_INSTALL_STATE_STORAGE_KEY, state);
  window.dispatchEvent(new Event(PHANTOM_INSTALL_STATE_CHANGE_EVENT));
}

export function WalletConnectButton() {
  const { wallet, connected, connecting, connect } = useWallet();
  const [walletStatus, setWalletStatus] = React.useState<WalletStatus>("detecting");
  const [phantomAvailable, setPhantomAvailable] = React.useState(false);
  const phantomInstallState = React.useSyncExternalStore(
    subscribeToPhantomInstallStateChange,
    readPhantomInstallStateSnapshot,
    () => "idle" as PhantomInstallState,
  );

  React.useEffect(() => {
    let mounted = true;

    const detectPhantom = () => {
      if (!mounted) {
        return;
      }

      const nextStatus = readWalletStatus();
      setWalletStatus(nextStatus);
      setPhantomAvailable(nextStatus === "phantom");

      if (nextStatus === "phantom") {
        setPhantomInstallState(connected ? "connected" : "detected");
      }
    };

    detectPhantom();

    window.addEventListener("focus", detectPhantom);
    window.addEventListener("visibilitychange", detectPhantom);
    const interval = window.setInterval(detectPhantom, 1000);

    return () => {
      mounted = false;
      window.removeEventListener("focus", detectPhantom);
      window.removeEventListener("visibilitychange", detectPhantom);
      window.clearInterval(interval);
    };
  }, [connected]);

  const buttonLabel = connected
    ? `Connected${wallet?.adapter.name ? `: ${wallet.adapter.name}` : ""}`
    : phantomAvailable
      ? "Detected: Phantom"
      : "Install Phantom";

  const handleConnect = async () => {
    if (connected) {
      return;
    }

    if (!phantomAvailable) {
      setPhantomInstallState("install-opened");

      if (typeof window !== "undefined") {
        window.open(PHANTOM_DOWNLOAD_URL, "_blank", "noopener,noreferrer");
      }

      if (walletStatus === "conflict") {
        toast({
          title: "Conflicting wallet extension detected",
          description:
            "Another wallet extension is already injecting ethereum. Disable the conflicting extension and keep Phantom enabled.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Phantom not detected",
        description: "We opened the Phantom download page. Install it, then come back and refresh.",
      });
      return;
    }

    try {
      const phantomProvider = readPhantomProvider();
      if (!phantomProvider) {
        toast({
          title: "Phantom is not available",
          description:
            "Phantom is installed in the browser but not available on this page. Refresh and try again.",
          variant: "destructive",
        });
        return;
      }

      await connect();
      setPhantomInstallState("connected");
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      const isEthereumConflict = /redefine property: ethereum/i.test(errorMessage);

      if (isEthereumConflict) {
        setWalletStatus("conflict");
        setPhantomAvailable(false);
        toast({
          title: "Conflicting wallet extension detected",
          description:
            "Phantom is installed, but another extension is fighting over ethereum injection. Disable other wallet extensions and try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Wallet connection failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const statusLabel =
    walletStatus === "phantom"
      ? "Phantom detected"
      : walletStatus === "conflict"
        ? "Conflicting wallet extension detected"
        : walletStatus === "none"
          ? "No wallet detected"
          : "Detecting wallet...";

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handleConnect}
        disabled={connecting || connected}
        className="wallet-adapter-button wallet-adapter-button-trigger inline-flex h-10 w-full items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 text-sm font-medium text-[color:var(--foreground)] shadow-sm"
      >
        {connecting ? "Connecting..." : buttonLabel}
      </Button>
      <p className="text-xs text-[color:var(--muted-foreground)]">
        {phantomInstallState === "install-opened"
          ? "The Phantom install page is open. Install the wallet, then come back and we will detect it automatically."
          : phantomInstallState === "detected"
            ? "Phantom is detected in this browser and ready to open."
            : phantomInstallState === "connected"
              ? "Phantom is connected and ready to continue."
              : "If Phantom is missing, we will open the install page and keep checking for it."}
      </p>
      <p className="text-xs text-[color:var(--muted-foreground)]">
        {statusLabel}
      </p>
      <p className="text-xs text-[color:var(--muted-foreground)]">
        {walletStatus === "phantom"
          ? "You can connect Phantom directly from this page."
          : walletStatus === "conflict"
            ? "Disable other wallet extensions that inject ethereum, then reload."
            : walletStatus === "none"
              ? "No compatible Solana wallet extension is currently detected in this browser."
              : "Checking for installed wallet extensions..."}
      </p>
    </div>
  );
}
