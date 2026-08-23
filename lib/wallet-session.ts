export const LAST_WALLET_SESSION_STORAGE_KEY = "nexafoundr:last-wallet-session";

export type LastWalletSession = {
  userId: string;
  email: string;
  name: string;
  role: "FOUNDER" | "INVESTOR" | "ADMIN";
  walletAddress: string | null;
  lastSeenAt: string;
};

export function readLastWalletSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSession = window.localStorage.getItem(LAST_WALLET_SESSION_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawSession) as Partial<LastWalletSession>;

    if (
      typeof parsed.userId !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.name !== "string" ||
      (parsed.role !== "FOUNDER" && parsed.role !== "INVESTOR" && parsed.role !== "ADMIN")
    ) {
      return null;
    }

    return {
      userId: parsed.userId,
      email: parsed.email,
      name: parsed.name,
      role: parsed.role,
      walletAddress: typeof parsed.walletAddress === "string" ? parsed.walletAddress : null,
      lastSeenAt:
        typeof parsed.lastSeenAt === "string" ? parsed.lastSeenAt : new Date().toISOString(),
    } satisfies LastWalletSession;
  } catch {
    return null;
  }
}

export function persistLastWalletSession(session: Omit<LastWalletSession, "lastSeenAt">) {
  if (typeof window === "undefined") {
    return;
  }

  const nextSession: LastWalletSession = {
    ...session,
    lastSeenAt: new Date().toISOString(),
  };

  window.localStorage.setItem(LAST_WALLET_SESSION_STORAGE_KEY, JSON.stringify(nextSession));
}

export function maskWalletAddress(address: string) {
  if (address.length <= 14) {
    return address;
  }

  return `${address.slice(0, 6)}*****${address.slice(-6)}`;
}
