import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireDashboardSessionUser } from "@/lib/dashboard-session";
import { getDisplayEmail } from "@/lib/utils";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";

export default async function SettingsPage() {
  const user = await requireDashboardSessionUser();

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
          Settings
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[color:var(--foreground)]">
          Account settings
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[color:var(--muted-foreground)]">
          Manage profile details, wallet routing, and account security from one
          place.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card className="border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm">
            <CardHeader>
              <CardDescription>Profile</CardDescription>
              <CardTitle>Update your avatar and display name</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileSettingsForm key={user.id} user={user} />
            </CardContent>
          </Card>

        <div className="space-y-6">
          <Card className="border-[color:var(--border)] bg-[color:var(--surface-strong)] shadow-sm">
            <CardHeader>
              <CardDescription>Account</CardDescription>
              <CardTitle>Current account details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-[color:var(--muted-foreground)]">
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <p className="text-xs uppercase tracking-[0.24em]">Email</p>
                <p className="mt-2 break-all text-sm font-medium text-[color:var(--foreground)]">
                  {getDisplayEmail(user.email)}
                </p>
              </div>

              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <p className="text-xs uppercase tracking-[0.24em]">Role</p>
                <p className="mt-2 text-sm font-medium text-[color:var(--foreground)]">
                  {user.role}
                </p>
              </div>

              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <p className="text-xs uppercase tracking-[0.24em]">Signed in wallet</p>
                <p className="mt-2 break-all text-sm font-medium text-[color:var(--foreground)]">
                  {user.founderWalletAddress ?? "Not connected"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[color:var(--border)] bg-[color:var(--surface-strong)] shadow-sm">
            <CardHeader>
              <CardDescription>Wallet</CardDescription>
              <CardTitle>Manage your connected wallet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[color:var(--muted-foreground)]">
                Reconnect Phantom or switch social accounts from the login screen whenever
                you need a fresh session.
              </p>

              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center rounded-md bg-[color:var(--primary)] px-4 text-sm font-medium text-[color:var(--primary-foreground)] transition-colors hover:bg-[color:var(--primary-hover)]"
              >
                Open login
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
