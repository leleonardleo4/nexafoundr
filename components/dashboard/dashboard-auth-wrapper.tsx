'use client';

import type { ReactNode } from 'react';

import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import type { DashboardNotificationFeed } from '@/lib/dashboard-notifications';
import type { DashboardSessionUser } from '@/lib/dashboard-session';

interface DashboardAuthWrapperProps {
  children: ReactNode;
  user: DashboardSessionUser;
  notifications: DashboardNotificationFeed;
}

/**
 * Client-side wrapper that renders the dashboard shell once the server has
 * resolved the authenticated user.
 */
export function DashboardAuthWrapper({ children, user, notifications }: DashboardAuthWrapperProps) {
  return (
    <DashboardShell
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage ?? user.image ?? null,
        role: user.role,
      }}
      notifications={notifications}
    >
      {children}
    </DashboardShell>
  );
}
