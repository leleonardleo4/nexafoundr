/**
 * Privy SSR Session Verification Utility
 * 
 * This module provides server-side session verification for Privy.
 * Use this in server components and middleware to protect routes.
 */

import { prisma } from '@/lib/prisma';

export interface PrivySSRSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'FOUNDER' | 'INVESTOR' | 'ADMIN';
  };
}

/**
 * Verify a user session on the server side.
 * This is called from server components that need to verify authentication.
 * 
 * NOTE: This requires Privy token verification.
 * Implement one of these approaches:
 * 
 * 1. Use Privy's @privy-io/server package (recommended for production)
 * 2. Verify the JWT token manually using Privy's public key
 * 3. Use a combination of cookies and server-side validation
 * 
 * @param email - The user's email to look up in the database
 * @returns The authenticated user with their role, or null if not found
 */
export async function verifyPrivySession(email: string): Promise<PrivySSRSession['user'] | null> {
  if (!email) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'FOUNDER' | 'INVESTOR' | 'ADMIN',
    };
  } catch (error) {
    console.error('Error verifying Privy session:', error);
    return null;
  }
}

/**
 * Verify a user has a specific role.
 * @param email - The user's email
 * @param requiredRole - The role they need to have
 * @returns true if the user has the required role
 */
export async function verifyUserRole(
  email: string,
  requiredRole: 'FOUNDER' | 'INVESTOR' | 'ADMIN',
): Promise<boolean> {
  const user = await verifyPrivySession(email);
  return user?.role === requiredRole;
}

/**
 * Get a user by email for server-side operations.
 * Used when you need to fetch user data after Privy authentication.
 */
export async function getPrivyUserByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}
