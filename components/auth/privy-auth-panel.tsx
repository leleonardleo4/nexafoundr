"use client";

import * as React from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { ArrowRight, Fingerprint, Loader2, ShieldCheck, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@prisma/client";

import { syncPrivyUser } from "@/app/actions/sync-privy-user";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardPath } from "@/lib/utils";

type AuthVariant = "login" | "signup";
type LoginMethod = "wallet" | "twitter";
type SignupRole = "FOUNDER" | "INVESTOR";

type AuthMethod = {
  id: LoginMethod;
  label: string;
  helper: string;
  detail: string;
  icon: typeof Fingerprint;
  glowClassName: string;
  buttonClassName: string;
  chipClassName: string;
};

const AUTH_COPY: Record<
  AuthVariant,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    cardTitle: string;
    cardDescription: string;
    status: string;
    altStatus: string;
    actionLabel: string;
  }
> = {
  login: {
    eyebrow: "Sign in",
    title: "Welcome back to NexaFoundr",
    subtitle:
      "Use Phantom or X to resume your account. Privy handles the session and keeps the handoff tidy.",
    cardTitle: "Continue with the wallet or X account you already use",
    cardDescription:
      "Pick Phantom for wallet access or X for social sign-in. Privy keeps the identity flow clean and the dashboard session in sync.",
    status: "Signing you in",
    altStatus: "Your account is already connected",
    actionLabel: "Open dashboard",
  },
  signup: {
    eyebrow: "Create account",
    title: "Create your NexaFoundr account",
    subtitle:
      "Choose Phantom or X to create a Privy-backed identity, then we will sync your dashboard session.",
    cardTitle: "Start with one clean login",
    cardDescription:
      "Choose Phantom for a wallet-first setup or X for social sign-in. Either path creates the same Privy session before we move you into the app.",
    status: "Creating your account",
    altStatus: "Your account is already set up",
    actionLabel: "Open dashboard",
  },
};

const AUTH_STEPS: Record<AuthVariant, Array<{ title: string; description: string }>> = {
  login: [
    {
      title: "1. Choose a path",
      description: "Sign in with Phantom or X depending on how you normally enter the app.",
    },
    {
      title: "2. Privy verifies",
      description: "Privy confirms your identity and hands us the active session details.",
    },
    {
      title: "3. Jump in",
      description: "We sync the dashboard session and route you to the right place.",
    },
  ],
  signup: [
    {
      title: "1. Choose a path",
      description: "Pick Phantom or X so we can create your Privy identity.",
    },
    {
      title: "2. Build your profile",
      description: "We store the account details we need to keep your dashboard in sync.",
    },
    {
      title: "3. Continue",
      description: "Once the session is ready, we move you straight into onboarding.",
    },
  ],
};

const AUTH_BADGES = ["Privy-backed identity", "Phantom wallet support", "X social login"] as const;

const AUTH_METHODS: Record<LoginMethod, AuthMethod> = {
  wallet: {
    id: "wallet",
    label: "Continue with Phantom",
    helper: "Best for wallet-native founders",
    detail:
      "Open the wallet-first path if you already live in Phantom. You’ll move through signing and setup without extra login hops.",
    icon: Fingerprint,
    glowClassName:
      "bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.28),transparent_58%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.18),transparent_56%),linear-gradient(160deg,rgba(8,47,73,0.98),rgba(15,23,42,0.94))]",
    buttonClassName:
      "border-[rgba(20,184,166,0.28)] bg-[linear-gradient(160deg,rgba(8,47,73,0.98),rgba(15,23,42,0.94))] text-white shadow-[0_24px_80px_-32px_rgba(20,184,166,0.45)] hover:border-[rgba(20,184,166,0.46)] hover:shadow-[0_28px_90px_-30px_rgba(20,184,166,0.55)]",
    chipClassName:
      "border border-teal-400/30 bg-teal-400/12 text-teal-100",
  },
  twitter: {
    id: "twitter",
    label: "Continue with X",
    helper: "Fastest social sign-in",
    detail:
      "Use X if that’s the identity you already trust. Privy will bring the session together, then we’ll route you onward.",
    icon: X,
    glowClassName:
      "bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.26),transparent_58%),radial-gradient(circle_at_bottom_left,rgba(148,163,184,0.14),transparent_56%),linear-gradient(160deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94))]",
    buttonClassName:
      "border-[rgba(148,163,184,0.26)] bg-[linear-gradient(160deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94))] text-white shadow-[0_24px_80px_-32px_rgba(59,130,246,0.42)] hover:border-[rgba(59,130,246,0.38)] hover:shadow-[0_28px_90px_-30px_rgba(59,130,246,0.52)]",
    chipClassName:
      "border border-sky-400/30 bg-sky-400/12 text-sky-100",
  },
};

type PrivyAuthPanelProps = {
  variant?: AuthVariant;
};

function getSignupRoleFromStorage() {
  if (typeof window === "undefined") {
    return "FOUNDER" as const;
  }

  const storedRole = window.sessionStorage.getItem("signupRole");

  if (storedRole === "INVESTOR" || storedRole === "ADMIN") {
    return storedRole;
  }

  return "FOUNDER" as const;
}

function getWalletAuthErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (/403|forbidden|siws/i.test(message)) {
    return "Privy rejected this site origin. Add http://localhost:3000 to your Privy app's allowed domains, then refresh and try again.";
  }

  return (
    message ||
    "Phantom could not be opened. Make sure the Phantom extension is installed and enabled for this site."
  );
}

export function PrivyAuthPanel({ variant = "login" }: PrivyAuthPanelProps) {
  const router = useRouter();
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [syncState, setSyncState] = React.useState<"idle" | "syncing" | "error">("idle");
  const [signupRole, setSignupRole] = React.useState<SignupRole>("FOUNDER");
  const [activeMethod, setActiveMethod] = React.useState<LoginMethod | null>(null);
  const [dashboardPath, setDashboardPath] = React.useState<string | null>(null);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const hasSyncedUser = React.useRef<string | null>(null);
  const loginResetTimer = React.useRef<number | null>(null);

  const copy = AUTH_COPY[variant];

  const walletAddress =
    user?.linkedAccounts?.find((account) => account.type === "wallet")?.address ?? null;
  const email = user?.email?.address ?? null;
  const displayName = email?.split("@")[0] ?? "Founder";
  const signedInWithX = Boolean(
    user?.linkedAccounts?.some((account) => account.type === "twitter_oauth"),
  );
  const signedInWithWallet = Boolean(walletAddress);

  React.useEffect(() => {
    return () => {
      if (loginResetTimer.current) {
        window.clearTimeout(loginResetTimer.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (!ready || !authenticated || !user) {
      return;
    }

    const currentUser = user;

    if (hasSyncedUser.current === currentUser.id) {
      return;
    }

    let cancelled = false;

    async function hydrateSession() {
      setSyncState("syncing");
      setAuthError(null);
      setDashboardPath(null);

      try {
        const role = getSignupRoleFromStorage() as Extract<UserRole, "FOUNDER" | "INVESTOR" | "ADMIN">;
        const loginMethod = signedInWithX ? "twitter" : "wallet";

        const syncedUser = await syncPrivyUser(
          currentUser.id,
          email ?? `${currentUser.id}@privy.local`,
          walletAddress,
          loginMethod,
          role,
          displayName,
        );

        if (cancelled) {
          return;
        }

        if (!syncedUser) {
          throw new Error("Privy user sync returned no user.");
        }

        hasSyncedUser.current = currentUser.id;
        const nextDashboardPath = getDashboardPath(syncedUser.role);
        setSyncState("idle");
        setDashboardPath(nextDashboardPath);
        window.sessionStorage.removeItem("signupRole");
        router.replace(nextDashboardPath);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Failed to sync Privy user:", error);
        setSyncState("error");
        setAuthError(
          error instanceof Error ? error.message : "We could not finish syncing your account.",
        );
      }
    }

    void hydrateSession();

    return () => {
      cancelled = true;
    };
  }, [authenticated, displayName, email, ready, router, signedInWithX, user, walletAddress]);

  const handleLogin = async (method: LoginMethod) => {
    if (loginResetTimer.current) {
      window.clearTimeout(loginResetTimer.current);
    }

    setActiveMethod(method);
    setAuthError(null);

    loginResetTimer.current = window.setTimeout(() => {
      setActiveMethod((current) => (current === method ? null : current));
    }, 1000);

    try {
      if (variant === "signup") {
        window.sessionStorage.setItem("signupRole", signupRole);
      }

      const loginResult = login({
        loginMethods: method === "wallet" ? ["wallet"] : ["twitter"],
      });

      await Promise.resolve(loginResult);
    } catch (error) {
      setActiveMethod(null);
      setAuthError(
        method === "wallet"
          ? getWalletAuthErrorMessage(error)
          : error instanceof Error
            ? error.message
            : "We could not open the selected sign-in method.",
      );
    }
  };

  const isBusy = syncState === "syncing" || activeMethod !== null;
  const activeCopy = authError
    ? authError
    : activeMethod === "wallet"
      ? "Opening Phantom..."
      : activeMethod === "twitter"
        ? "Opening X..."
        : syncState === "syncing"
          ? copy.status
          : authenticated
            ? copy.altStatus
            : "Choose a sign-in path";
  const canOpenDashboard = Boolean(dashboardPath) && syncState !== "syncing";
  const authMethodCards = [AUTH_METHODS.wallet, AUTH_METHODS.twitter];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[color:var(--background)] px-4 py-6 text-[color:var(--foreground)] sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_26%),radial-gradient(circle_at_top_right,rgba(37,99,235,0.18),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(124,58,237,0.16),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-[color:var(--border)] to-transparent" />
      <div className="absolute left-1/2 top-14 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.16),transparent_72%)] blur-3xl" />
      <div className="absolute right-[-7rem] top-1/3 -z-10 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.16),transparent_70%)] blur-3xl" />
      <div className="absolute left-[-8rem] bottom-[-7rem] -z-10 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.14),transparent_70%)] blur-3xl" />

      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.06fr_0.94fr]">
          <section className="relative overflow-hidden rounded-[2.25rem] border border-[color:var(--border)] bg-[linear-gradient(160deg,rgba(9,15,31,0.96),rgba(15,23,42,0.9))] p-7 shadow-[0_40px_120px_rgba(15,23,42,0.42)] backdrop-blur-sm sm:p-9 lg:p-11">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(20,184,166,0.1),transparent_34%,rgba(124,58,237,0.1)_72%,transparent)]" />
            <div className="absolute -right-16 top-10 h-56 w-56 rounded-full border border-white/10 bg-[radial-gradient(circle,rgba(20,184,166,0.24),transparent_72%)] blur-2xl" />
            <div className="absolute bottom-0 left-0 h-44 w-44 rounded-full border border-white/10 bg-[radial-gradient(circle,rgba(37,99,235,0.16),transparent_72%)] blur-2xl" />

            <div className="relative flex h-full min-h-[34rem] flex-col justify-between gap-12">
              <div className="space-y-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.38em] text-white/70">
                  <Sparkles className="h-3.5 w-3.5" />
                  Privy auth
                </div>

                <div className="space-y-5">
                  <h1 className="max-w-xl text-4xl font-semibold tracking-[-0.04em] text-white text-balance sm:text-5xl lg:text-[3.6rem]">
                    {copy.title}
                  </h1>
                  <p className="max-w-xl text-sm leading-7 text-white/70 sm:text-[1.02rem]">
                    {copy.subtitle}
                  </p>
                </div>

              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    icon: Fingerprint,
                    title: "Phantom-first",
                    detail: "Open the wallet path straight from Privy without extra detours.",
                  },
                  {
                    icon: X,
                    title: "X login",
                    detail: "Return users quickly through the X OAuth flow.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Session synced",
                    detail: "We create the dashboard session as soon as Privy authenticates.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-3xl border border-white/10 bg-white/5 p-4 text-white/80 shadow-[0_20px_60px_rgba(2,6,23,0.18)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold tracking-[-0.02em] text-white">{item.title}</p>
                        <p className="mt-1 text-xs leading-5 text-white/66">{item.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="relative rounded-[2.25rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_30px_90px_rgba(15,23,42,0.16)] backdrop-blur-2xl sm:p-6 lg:p-8">
            <Card className="border-[color:var(--border)] bg-[color:var(--surface-strong)] shadow-none">
              <CardHeader className="space-y-4">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3">
                    <CardDescription className="text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-[color:var(--muted-foreground)]">
                      {copy.eyebrow}
                    </CardDescription>
                    <CardTitle className="max-w-xl text-[1.75rem] font-semibold tracking-[-0.04em] text-[color:var(--foreground)] sm:text-[1.9rem]">
                      {copy.cardTitle}
                    </CardTitle>
                  </div>

                  <div className="inline-flex rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] p-1 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
                    <Link
                      href="/login"
                      className={[
                        "rounded-full px-3 py-2 transition-colors",
                        variant === "login"
                          ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                          : "hover:text-[color:var(--foreground)]",
                      ].join(" ")}
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      className={[
                        "rounded-full px-3 py-2 transition-colors",
                        variant === "signup"
                          ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                          : "hover:text-[color:var(--foreground)]",
                      ].join(" ")}
                    >
                      Create account
                    </Link>
                  </div>
                </div>
                <p className="max-w-2xl text-sm leading-7 text-[color:var(--muted-foreground)] sm:text-[0.98rem]">
                  {copy.cardDescription}
                </p>
              </CardHeader>

              <CardContent className="space-y-5">
                {variant === "signup" ? (
                  <fieldset className="space-y-3 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                    <legend className="px-1 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted-foreground)]">
                      I am joining as a
                    </legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        {
                          role: "FOUNDER" as const,
                          title: "Founder",
                          detail: "Build and verify a startup.",
                        },
                        {
                          role: "INVESTOR" as const,
                          title: "Investor",
                          detail: "Discover and fund startups.",
                        },
                      ].map((option) => {
                        const selected = signupRole === option.role;

                        return (
                          <button
                            key={option.role}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setSignupRole(option.role)}
                            className={[
                              "rounded-2xl border p-4 text-left transition-colors",
                              selected
                                ? "border-[color:var(--primary)] bg-[color:var(--primary)]/10"
                                : "border-[color:var(--border)] bg-[color:var(--surface-strong)] hover:border-[color:var(--primary)]/60",
                            ].join(" ")}
                          >
                            <span className="block text-sm font-semibold text-[color:var(--foreground)]">
                              {option.title}
                            </span>
                            <span className="mt-1 block text-sm leading-6 text-[color:var(--muted-foreground)]">
                              {option.detail}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                ) : null}

                {!ready ? (
                  <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
                    <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">
                      Loading your Privy session...
                    </p>
                  </div>
                ) : authenticated && user ? (
                  <div className="space-y-4 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
                    <div className="space-y-2">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-[color:var(--muted-foreground)]">
                        Signed in
                      </p>
                      <p className="text-xl font-semibold tracking-[-0.03em] text-[color:var(--foreground)]">
                        {email?.split("@")[0] ?? "Your account"} is connected.
                      </p>
                      <p className="max-w-lg text-sm leading-7 text-[color:var(--muted-foreground)]">
                        {syncState === "syncing"
                          ? "Syncing your dashboard session now..."
                          : syncState === "error"
                            ? "We hit a sync issue. Try signing out and back in."
                            : "You're ready to jump into the dashboard."}
                      </p>
                    </div>

                    <div className="grid gap-3 text-sm text-[color:var(--muted-foreground)] sm:grid-cols-2">
                      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
                        <p className="text-[0.7rem] uppercase tracking-[0.28em]">Wallet</p>
                        <p className="mt-2 break-all text-sm font-medium leading-6 tracking-[-0.01em] text-[color:var(--foreground)]">
                          {signedInWithWallet ? walletAddress : "No wallet linked yet"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
                        <p className="text-[0.7rem] uppercase tracking-[0.28em]">Social</p>
                        <p className="mt-2 text-sm font-medium leading-6 tracking-[-0.01em] text-[color:var(--foreground)]">
                          {signedInWithX ? "X connected" : "X not linked"}
                        </p>
                      </div>
                    </div>

                    {authError ? (
                      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                        {authError}
                      </div>
                    ) : null}

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        type="button"
                        onClick={() => {
                          if (dashboardPath) {
                            router.push(dashboardPath);
                          }
                        }}
                        disabled={!canOpenDashboard}
                        className="h-11 rounded-full px-5 text-sm font-semibold"
                      >
                        {syncState === "syncing" ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            {copy.actionLabel}
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => void logout()}
                        className="h-11 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-5 text-sm font-semibold text-[color:var(--foreground)] shadow-none hover:bg-[color:var(--surface-strong)]"
                      >
                        Sign out
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {authMethodCards.map((method) => {
                        const isActive = activeMethod === method.id;
                        const Icon = method.icon;

                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => void handleLogin(method.id)}
                            disabled={isBusy}
                            className={[
                              "group relative overflow-hidden rounded-[1.75rem] border p-0 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface)] disabled:cursor-not-allowed disabled:opacity-80",
                              method.buttonClassName,
                              isActive
                                ? "translate-y-[-1px] scale-[1.01]"
                                : "hover:-translate-y-0.5 hover:scale-[1.01]",
                            ].join(" ")}
                          >
                            <span
                              className={[
                                "absolute inset-0 opacity-90 transition-opacity duration-300 group-hover:opacity-100",
                                method.glowClassName,
                              ].join(" ")}
                            />
                            <span className="relative flex min-h-[9rem] flex-col justify-between gap-4 p-5">
                              <span className="flex items-start justify-between gap-3">
                                <span className="flex items-center gap-3">
                                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white shadow-[0_14px_40px_rgba(0,0,0,0.18)]">
                                    {isActive ? (
                                      <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                      <Icon className="h-5 w-5" />
                                    )}
                                  </span>
                                  <span className="space-y-1">
                                    <span className="block text-sm font-semibold tracking-[-0.03em] text-white sm:text-base">
                                      {method.label}
                                    </span>
                                    <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-white/62">
                                      {method.helper}
                                    </span>
                                  </span>
                                </span>

                                <span
                                  className={[
                                    "rounded-full px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.22em]",
                                    method.chipClassName,
                                  ].join(" ")}
                                >
                                  {method.id === "wallet" ? "Recommended" : "Fast social"}
                                </span>
                              </span>

                              <span className="flex items-end justify-between gap-4">
                                <span className="max-w-xs text-sm leading-6 text-white/72">
                                  {method.detail}
                                </span>
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-transform duration-300 group-hover:translate-x-0.5">
                                  <ArrowRight className="h-4 w-4" />
                                </span>
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 text-sm leading-6 text-[color:var(--muted-foreground)]">
                      <p className="text-[0.95rem] font-medium tracking-[-0.02em] text-[color:var(--foreground)]">
                        {activeCopy}
                      </p>
                      <p className="mt-2 max-w-2xl">
                        Phantom gets the wallet path. X keeps social sign-in familiar. Privy links
                        them into a single session, then we send you to the right dashboard.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {AUTH_BADGES.map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="grid gap-4 sm:grid-cols-3">
                  {AUTH_STEPS[variant].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4"
                    >
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted-foreground)]">
                        {item.title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}
