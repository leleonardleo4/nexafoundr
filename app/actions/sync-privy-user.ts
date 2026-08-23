'use server';

import { prisma } from '@/lib/prisma';
import type { UserRole } from '@prisma/client';
import type { DashboardSessionUser } from '@/lib/dashboard-session';
import { setDashboardSession } from '@/lib/dashboard-session';

/**
 * Syncs a Privy user with the Prisma database.
 * This action is called immediately after Privy authentication succeeds.
 * 
 * @param privyDID - The Privy user's decentralized identifier
 * @param email - The user's email from Privy
 * @param walletAddress - Optional wallet address from Privy
 * @param role - The user's role (FOUNDER or INVESTOR)
 * @param name - The user's name
 */
export async function syncPrivyUser(
  privyDID: string,
  email: string | null | undefined,
  walletAddress: string | null | undefined,
  signupMethod: "wallet" | "twitter" | "telegram" | null,
  role: UserRole,
  name: string,
) {
  if (!privyDID) {
    throw new Error('Privy DID is required');
  }

  if (role !== 'FOUNDER' && role !== 'INVESTOR' && role !== 'ADMIN') {
    throw new Error('Invalid role. Must be FOUNDER, INVESTOR, or ADMIN');
  }

  try {
    const resolvedEmail = email ?? `${privyDID}@privy.local`;
    const userId = `privy_${privyDID}`;
    const normalizedWalletAddress = walletAddress?.trim() || null;
    const generatedWalletName = normalizedWalletAddress
      ? `${role === "INVESTOR" ? "Investor" : "Founder"} ${normalizedWalletAddress.slice(0, 4)}...${normalizedWalletAddress.slice(-4)}`
      : null;

    let user = normalizedWalletAddress
      ? await prisma.user.findFirst({
          where: { founderWalletAddress: normalizedWalletAddress },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            founderWalletAddress: true,
          },
        })
      : null;

    user ??= await prisma.user.findFirst({
      where: {
        OR: [{ id: userId }, { email: resolvedEmail }],
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        founderWalletAddress: true,
      },
    });

    if (user) {
      if (
        normalizedWalletAddress &&
        user.founderWalletAddress &&
        user.founderWalletAddress !== normalizedWalletAddress
      ) {
        throw new Error(
          "This Privy identity is linked to a different wallet. Log out and approve the wallet linked to this account.",
        );
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name || user.name,
          email: user.email || resolvedEmail,
          founderWalletAddress: normalizedWalletAddress ?? user.founderWalletAddress,
        },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          founderWalletAddress: true,
        },
      });

      await setDashboardSession({
        userId: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role as UserRole,
        name: updatedUser.name,
        walletAddress: updatedUser.founderWalletAddress ?? normalizedWalletAddress,
        walletApprovedAt: new Date().toISOString(),
      });

      return updatedUser;
    }

    // Create new user with the selected role
    user = await prisma.user.create({
      data: {
        id: userId,
        name: name && name !== "Founder" ? name : generatedWalletName ?? (role === "INVESTOR" ? "Investor" : "Founder"),
        email: resolvedEmail,
        role,
        emailVerified: true, // Privy handles email verification
        founderWalletAddress: normalizedWalletAddress,
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        founderWalletAddress: true,
      },
    });

    await setDashboardSession({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      name: user.name,
      walletAddress: user.founderWalletAddress ?? normalizedWalletAddress,
      walletApprovedAt: new Date().toISOString(),
    });

    return user;
  } catch (error) {
    // Handle unique constraint violation for email
    if (error instanceof Error && 'code' in error) {
      if ((error as { code: string }).code === 'P2002') {
        // This shouldn't happen due to our check above, but handle it just in case
        const existingUser = await prisma.user.findUnique({
          where: { email: email ?? `${privyDID}@privy.local` },
          select: {
            id: true,
            role: true,
          },
        });
        return existingUser;
      }
    }
    throw error;
  }
}

/**
 * Rehydrates an existing Privy user into a dashboard session.
 * This is used after login so returning users go straight to their dashboard.
 */
export async function hydratePrivyDashboardSession(
  privyDID: string,
  email: string | null | undefined,
  walletAddress: string | null | undefined,
): Promise<DashboardSessionUser | null> {
  if (!privyDID) {
    throw new Error('Privy DID is required');
  }

  const resolvedEmail = email ?? `${privyDID}@privy.local`;
  const userId = `privy_${privyDID}`;

  const user =
    (await prisma.user.findFirst({
      where: {
        OR: [{ id: userId }, { email: resolvedEmail }],
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        founderWalletAddress: true,
        profileImage: true,
        image: true,
      },
    })) ?? null;

  if (!user) {
    return null;
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      email: user.email || resolvedEmail,
      founderWalletAddress: walletAddress ?? user.founderWalletAddress,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      founderWalletAddress: true,
      profileImage: true,
      image: true,
    },
  });

  await setDashboardSession({
    userId: updatedUser.id,
    email: updatedUser.email,
    role: updatedUser.role as UserRole,
    name: updatedUser.name,
    walletAddress: updatedUser.founderWalletAddress ?? walletAddress ?? null,
    walletApprovedAt: new Date().toISOString(),
  });

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    role: updatedUser.role as DashboardSessionUser['role'],
    founderWalletAddress: updatedUser.founderWalletAddress ?? null,
    profileImage: updatedUser.profileImage ?? updatedUser.image ?? null,
    image: updatedUser.image ?? updatedUser.profileImage ?? null,
  };
}

/**
 * Checks whether a Solana wallet address already belongs to a NexaFoundr user.
 * This helps the login flow distinguish returning wallets from brand-new ones.
 */
export async function lookupWalletAccount(walletAddress: string) {
  const normalizedWalletAddress = walletAddress.trim();

  if (!normalizedWalletAddress) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      founderWalletAddress: normalizedWalletAddress,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      founderWalletAddress: true,
      profileImage: true,
      image: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as DashboardSessionUser['role'],
    founderWalletAddress: user.founderWalletAddress ?? null,
    profileImage: user.profileImage ?? user.image ?? null,
    image: user.image ?? user.profileImage ?? null,
  };
}

/**
 * Gets a user by their email or creates one if they don't exist.
 * Useful for checking if a user is authenticated and in our database.
 */
export async function getOrCreatePrivyUser(
  privyDID: string,
  email: string,
  walletAddress: string | null | undefined,
  signupMethod: "wallet" | "twitter" | "telegram" | null,
  role: Extract<UserRole, 'FOUNDER' | 'INVESTOR'>,
  name: string,
) {
  const user = await syncPrivyUser(privyDID, email, walletAddress, signupMethod, role, name);
  return user;
}

/**
 * Verifies if a user exists in the database and is properly synced.
 */
export async function verifyPrivyUserSync(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
      emailVerified: true,
    },
  });

  return user;
}
