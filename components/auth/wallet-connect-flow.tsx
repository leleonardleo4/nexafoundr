"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePrivy } from "@privy-io/react-auth";

import { WalletConnectButton } from "@/components/solana/wallet-connect-button";
import { FounderWalletForm } from "@/components/settings/founder-wallet-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { completeWalletOnboarding } from "@/app/actions/profile";
import { hydratePrivyDashboardSession } from "@/app/actions/sync-privy-user";
import { toast } from "@/components/ui/use-toast";
import { getDashboardPath, getDisplayEmail, type DashboardRole } from "@/lib/utils";

type WalletConnectMode = "onboarding" | "manage" | "gated";

type WalletConnectFlowProps = {
  mode?: WalletConnectMode;
  user?: {
    name: string;
    email: string;
    role: DashboardRole;
    founderWalletAddress: string | null;
  };
};

export function WalletConnectFlow({
  mode = "onboarding",
  user,
}: WalletConnectFlowProps) {
  const router = useRouter();
  const { connected, connecting, publicKey, signMessage } = useWallet();
  const { ready, authenticated, user: privyUser } = usePrivy();
  const hasCompletedOnboardingRef = React.useRef(false);
  const hasApprovedLoginRef = React.useRef(false);
  const [isApprovingLogin, setIsApprovingLogin] = React.useState(false);

  const walletAddress = publicKey?.toBase58() ?? null;
  const dashboardUser = user ?? null;
  const isFounder = dashboardUser?.role === "FOUNDER";
  const shouldShowOnboarding =
    mode !== "manage" && Boolean(dashboardUser) && !dashboardUser?.founderWalletAddress;
  const hasLinkedFounderWallet =
    Boolean(dashboardUser && isFounder && dashboardUser.founderWalletAddress) &&
    dashboardUser?.founderWalletAddress === walletAddress;

  const canContinue =
    connected &&
    Boolean(walletAddress) &&
    (!isFounder || hasLinkedFounderWallet);

  React.useEffect(() => {
    if ((mode === "gated" && !dashboardUser) || mode === "manage" || connecting || !dashboardUser) {
      return;
    }

    if (!shouldShowOnboarding) {
      router.replace(getDashboardPath(dashboardUser!.role));
      router.refresh();
      return;
    }

    if (!canContinue) {
      return;
    }

    if (hasCompletedOnboardingRef.current) {
      return;
    }

    hasCompletedOnboardingRef.current = true;

    void completeWalletOnboarding(walletAddress)
      .then(() => {
        router.replace(getDashboardPath(dashboardUser!.role));
        router.refresh();
      })
      .catch((error) => {
        hasCompletedOnboardingRef.current = false;
        toast({
          title: "Could not finish wallet setup",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      })
  }, [canContinue, connecting, dashboardUser, mode, router, shouldShowOnboarding, walletAddress]);

  const walletMismatch =
    Boolean(dashboardUser) &&
    isFounder &&
    connected &&
    Boolean(walletAddress) &&
    Boolean(dashboardUser?.founderWalletAddress) &&
    dashboardUser.founderWalletAddress !== walletAddress;

  const handleApproveLogin = async () => {
    if (hasApprovedLoginRef.current || isApprovingLogin) {
      return;
    }

    if (!ready || !authenticated || !privyUser) {
      toast({
        title: "Privy is not ready",
        description: "Sign in first, then return here to approve the dashboard login.",
        variant: "destructive",
      });
      return;
    }

    if (!connected || !walletAddress) {
      toast({
        title: "Connect Phantom first",
        description: "Approve the login after your Phantom wallet is connected.",
        variant: "destructive",
      });
      return;
    }

    if (typeof signMessage !== "function") {
      toast({
        title: "Wallet signing is unavailable",
        description: "Phantom needs to support message signing before we can continue.",
        variant: "destructive",
      });
      return;
    }

    hasApprovedLoginRef.current = true;
    setIsApprovingLogin(true);

    try {
      const approvalMessage = new TextEncoder().encode(
        `Approve NexaFoundr dashboard access for ${privyUser.email?.address ?? privyUser.id} with ${walletAddress}.`,
      );
      await signMessage(approvalMessage);

      const dashboardSessionUser = await hydratePrivyDashboardSession(
        privyUser.id,
        privyUser.email?.address ?? null,
        walletAddress,
      );

      if (!dashboardSessionUser) {
        hasApprovedLoginRef.current = false;
        throw new Error("We could not load your dashboard account.");
      }

      router.replace(getDashboardPath(dashboardSessionUser.role));
      router.refresh();
    } catch (error) {
      hasApprovedLoginRef.current = false;
      toast({
        title: "Could not approve login",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApprovingLogin(false);
    }
  };

  if (mode === "gated" && !dashboardUser) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-4xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-[color:var(--border)] bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(37,99,235,0.12),_transparent_28%),linear-gradient(180deg,_rgba(255,251,245,0.96),_rgba(244,239,230,0.92))] p-6 shadow-[0_24px_90px_-45px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--accent)]">
              Phantom approval
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-4xl">
              Approve the login in Phantom to unlock the dashboard.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[color:var(--muted-foreground)] sm:text-base">
              Your dashboard will stay locked until Phantom confirms the login. Sign the approval,
              then we will move you straight through.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "1. Connect",
                  description: "Open Phantom and connect the wallet you want to use.",
                },
                {
                  title: "2. Approve",
                  description: "Sign the login approval inside Phantom.",
                },
                {
                  title: "3. Enter",
                  description: "We unlock the dashboard right after approval succeeds.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 shadow-sm"
                >
                  <h2 className="text-sm font-semibold text-[color:var(--foreground)]">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <Card className="border-[color:var(--border)] bg-[color:var(--surface)] shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
            <CardHeader>
              <CardDescription>
                {authenticated ? "Privy authenticated" : "Waiting for login"}
              </CardDescription>
              <CardTitle>Phantom approval required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 text-sm text-[color:var(--muted-foreground)]">
                <p className="font-medium text-[color:var(--foreground)]">
                  {connected && walletAddress ? "Wallet connected" : "No wallet connected yet"}
                </p>
                <p className="mt-2 break-all">
                  {connected && walletAddress
                    ? walletAddress
                    : "Connect Phantom, then approve the login to continue."}
                </p>
              </div>

              <WalletConnectButton />

              <Button
                type="button"
                onClick={() => void handleApproveLogin()}
                disabled={!ready || !authenticated || !connected || !walletAddress || isApprovingLogin}
                className="w-full bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:bg-[color:var(--primary-hover)]"
              >
                {isApprovingLogin ? "Waiting for approval..." : "Approve login in Phantom"}
              </Button>

              <Button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--foreground)] hover:bg-[color:var(--surface)]"
              >
                Back to login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-6xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[2rem] border border-[color:var(--border)] bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(37,99,235,0.12),_transparent_28%),linear-gradient(180deg,_rgba(255,251,245,0.96),_rgba(244,239,230,0.92))] p-6 shadow-[0_24px_90px_-45px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--accent)]">
            Wallet onboarding
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-4xl">
            Connect your wallet before entering the dashboard.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[color:var(--muted-foreground)] sm:text-base">
            This page is only for users who did not complete signup with Phantom.
            Once the wallet is connected, we&apos;ll move you straight through.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "1. Connect",
                description: "Open your installed Solana wallet and approve the connection.",
              },
              {
                title: "2. Verify",
                description: "Founders confirm their routing wallet here.",
              },
              {
                title: "3. Continue",
                description: "We unlock the dashboard once the wallet is ready.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 shadow-sm"
              >
                <h2 className="text-sm font-semibold text-[color:var(--foreground)]">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <Card className="border-[color:var(--border)] bg-[color:var(--surface)] shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
            <CardHeader>
              <CardDescription>Signed in as {dashboardUser ? getDisplayEmail(dashboardUser.email) : "Wallet account"}</CardDescription>
              <CardTitle>{dashboardUser?.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 text-sm text-[color:var(--muted-foreground)]">
                {connecting ? (
                  <p className="font-medium text-[color:var(--foreground)]">
                    Checking wallet connection...
                  </p>
                ) : connected && walletAddress ? (
                  <>
                    <p className="font-medium text-[color:var(--foreground)]">
                      Wallet connected
                    </p>
                    <p className="mt-2 break-all">{walletAddress}</p>
                    {walletMismatch ? (
                      <p className="mt-3 text-[color:var(--accent)]">
                        This wallet does not match the founder wallet on file. Save
                        the connected wallet below to update it.
                      </p>
                    ) : hasLinkedFounderWallet ? (
                      <p className="mt-3 text-[color:var(--primary)]">
                        Your founder wallet is already linked and verified.
                      </p>
                    ) : (
                      <p className="mt-3 text-[color:var(--muted-foreground)]">
                        We will continue automatically once setup is complete.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="font-medium text-[color:var(--foreground)]">
                      No wallet connected yet
                    </p>
                    <p className="mt-2">
                      Connect your installed Solana wallet to continue.
                    </p>
                  </>
                )}
              </div>

              {mode === "manage" || shouldShowOnboarding ? <WalletConnectButton /> : null}

              {(mode === "manage" || shouldShowOnboarding) && isFounder ? (
                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
                  <p className="text-sm font-medium text-[color:var(--foreground)]">
                    Founder wallet
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                    Save the connected wallet as your founder routing address.
                  </p>
                  <div className="mt-4">
                    <FounderWalletForm currentWalletAddress={dashboardUser?.founderWalletAddress ?? null} />
                  </div>
                </div>
              ) : null}

              {mode === "manage" || shouldShowOnboarding ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  {mode === "gated" ? (
                    <Button
                      type="button"
                      onClick={() => router.push("/login")}
                      className="border border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--foreground)] hover:bg-[color:var(--surface)]"
                    >
                      Back to login
                    </Button>
                  ) : null}
                  {mode === "manage" ? (
                    <Button
                      type="button"
                      onClick={() => router.push(getDashboardPath(dashboardUser!.role))}
                      disabled={!connected || !walletAddress}
                    >
                      Return to dashboard
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
