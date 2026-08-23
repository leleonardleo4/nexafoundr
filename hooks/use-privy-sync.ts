'use client';

import { useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { syncPrivyUser } from '@/app/actions/sync-privy-user';
import type { UserRole } from '@prisma/client';
import { getDashboardPath } from '@/lib/utils';

/**
 * Hook that automatically syncs Privy user with database on authentication.
 * Also handles role-based routing.
 */
export function usePrivySync() {
  const { user, ready } = usePrivy();
  const router = useRouter();

  const syncUser = useCallback(async () => {
    if (!user) return;

    try {
      // Get the selected role from sessionStorage (set during signup)
      const selectedRole = (sessionStorage.getItem('signupRole') || 'FOUNDER') as Extract<UserRole, 'FOUNDER' | 'INVESTOR'>;
      
      // Get the primary email and wallet
      const email =
        typeof user.email === 'string'
          ? user.email
          : user.email?.address ?? user.id;
      const walletAddress = user.linkedAccounts
        ?.find((account) => account.type === 'wallet')
        ?.address;
      const signupMethod = user.linkedAccounts?.some((account) => account.type === 'twitter_oauth')
        ? 'twitter'
        : 'wallet';

      if (!email) {
        console.error('No email found in Privy user');
        return;
      }

      const syncedUser = await syncPrivyUser(
        user.id,
        email,
        walletAddress,
        signupMethod,
        selectedRole,
        email.split('@')[0] || '',
      );

      if (!syncedUser) {
        throw new Error('Privy sync did not return a user record.');
      }

      // Clear the stored role
      sessionStorage.removeItem('signupRole');

      // Route based on user role
      const dashboardPath = getDashboardPath(syncedUser.role);
      router.push(dashboardPath);
    } catch (error) {
      console.error('Failed to sync Privy user with database:', error);
    }
  }, [user, router]);

  useEffect(() => {
    if (ready && user && user.email) {
      syncUser();
    }
  }, [ready, user, syncUser]);
}

/**
 * Hook to check if user is authenticated with Privy.
 */
export function usePrivyUser() {
  const { user, ready, logout } = usePrivy();

  return {
    user,
    ready,
    logout,
    isAuthenticated: !!user && !!user.email,
  };
}
