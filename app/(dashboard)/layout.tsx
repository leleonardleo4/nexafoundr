import type { ReactNode } from "react";

import { DashboardAuthWrapper } from "@/components/dashboard/dashboard-auth-wrapper";
import { getDashboardNotifications } from "@/lib/dashboard-notifications";
import { requireDashboardSessionUser } from "@/lib/dashboard-session";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await requireDashboardSessionUser();

  const notifications = await getDashboardNotifications(user);

  return (
    <DashboardAuthWrapper user={user} notifications={notifications}>
      {children}
    </DashboardAuthWrapper>
  );
}
