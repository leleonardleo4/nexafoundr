import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getDashboardPath, isDashboardRole, type DashboardRole } from "@/lib/utils";

export const DASHBOARD_SESSION_COOKIE = "nexafoundr:dashboard-session";

export type DashboardSessionPayload = {
  userId: string;
  email: string;
  role: DashboardRole;
  name: string;
  walletAddress: string | null;
  walletApprovedAt?: string | null;
};

export type DashboardSessionUser = {
  id: string;
  email: string;
  name: string;
  role: DashboardRole;
  founderWalletAddress: string | null;
  profileImage: string | null;
  image: string | null;
};

function encodeSession(payload: DashboardSessionPayload) {
  return encodeURIComponent(JSON.stringify(payload));
}

function decodeSession(raw: string): DashboardSessionPayload | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<DashboardSessionPayload>;

    if (
      typeof parsed.userId !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.role !== "string" ||
      !isDashboardRole(parsed.role) ||
      (typeof parsed.walletAddress !== "string" && parsed.walletAddress !== null) ||
      (typeof parsed.walletApprovedAt !== "string" && parsed.walletApprovedAt !== null)
    ) {
      return null;
    }

    return {
      userId: parsed.userId,
      email: parsed.email,
      name: parsed.name,
      role: parsed.role,
      walletAddress: parsed.walletAddress ?? null,
      walletApprovedAt: parsed.walletApprovedAt ?? null,
    };
  } catch {
    return null;
  }
}

async function getRawDashboardSession() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(DASHBOARD_SESSION_COOKIE);

  if (!cookie?.value) {
    return null;
  }

  return decodeSession(cookie.value);
}

export async function setDashboardSession(payload: DashboardSessionPayload) {
  const cookieStore = await cookies();
  const currentSession = await getRawDashboardSession();
  const finalPayload: DashboardSessionPayload = {
    ...payload,
    walletApprovedAt: payload.walletApprovedAt ?? currentSession?.walletApprovedAt ?? null,
  };

  cookieStore.set(DASHBOARD_SESSION_COOKIE, encodeSession(finalPayload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearDashboardSession() {
  const cookieStore = await cookies();
  cookieStore.delete(DASHBOARD_SESSION_COOKIE);
}

export async function getDashboardSession() {
  const session = await getRawDashboardSession();
  return session;
}

export async function getDashboardSessionUser(): Promise<DashboardSessionUser | null> {
  const session = await getDashboardSession();

  if (!session) {
    return null;
  }

  const user =
    (await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        founderWalletAddress: true,
        profileImage: true,
        image: true,
      },
    })) ??
    (await prisma.user.findUnique({
      where: { email: session.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        founderWalletAddress: true,
        profileImage: true,
        image: true,
      },
    }));

  if (!user || !isDashboardRole(user.role)) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    founderWalletAddress: user.founderWalletAddress ?? null,
    profileImage: user.profileImage ?? user.image ?? null,
    image: user.image ?? user.profileImage ?? null,
  };
}

export async function requireDashboardSessionUser(requiredRole?: DashboardRole) {
  const session = await getRawDashboardSession();

  if (!session) {
    redirect("/login");
  }

  const user = await getDashboardSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (requiredRole && user.role !== requiredRole) {
    redirect(getDashboardPath(user.role));
  }

  return user;
}
