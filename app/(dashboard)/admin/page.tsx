import Link from "next/link";

import { ChatRequestsTable } from "@/components/admin/chat-requests-table";
import { PendingStartupsTable } from "@/components/admin/pending-startups-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireDashboardSessionUser } from "@/lib/dashboard-session";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const user = await requireDashboardSessionUser("ADMIN");

  const pendingStartups = await prisma.startup.findMany({
    where: {
      verificationStatus: "PENDING",
    },
    include: {
      founder: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const chatRequests = await prisma.conversation.findMany({
    where: {
      status: "PENDING",
    },
    include: {
      founder: {
        select: {
          name: true,
          email: true,
        },
      },
      investor: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const startupNames = await prisma.startup.findMany({
    where: {
      id: {
        in: chatRequests
          .map((request) => request.startupId)
          .filter((startupId): startupId is string => Boolean(startupId)),
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  const startupNameById = new Map(startupNames.map((startup) => [startup.id, startup.name]));

  const chatRequestsWithStartupNames = chatRequests.map((request) => ({
    ...request,
    startupName: request.startupId ? startupNameById.get(request.startupId) ?? null : null,
  }));

  const activeChats = await prisma.conversation.count({
    where: {
      status: "ACTIVE",
    },
  });

  const closedChats = await prisma.conversation.count({
    where: {
      status: "CLOSED",
    },
  });

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
              Admin control center
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[color:var(--foreground)]">
              Manage verification and chat access, {user.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[color:var(--muted-foreground)]">
              Keep startup approvals moving and control investor chat requests before
              they become active conversations.
            </p>
          </div>

          <Button asChild className="w-fit">
            <Link href="#chat-requests">Jump to chat requests</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: "Pending startups",
            value: pendingStartups.length.toString(),
            tone: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
          },
          {
            label: "Open chat requests",
            value: chatRequests.length.toString(),
            tone: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300",
          },
          {
            label: "Active conversations",
            value: activeChats.toString(),
            tone: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300",
          },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl">{item.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={item.tone}>Live</Badge>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card id="pending-startups">
        <CardHeader>
          <CardTitle>Pending startup approvals</CardTitle>
          <CardDescription>
            Every row below is waiting on an admin decision.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PendingStartupsTable startups={pendingStartups} />
        </CardContent>
      </Card>

      <Card id="chat-requests">
        <CardHeader>
          <CardTitle>Investor chat requests</CardTitle>
          <CardDescription>
            Approve or decline investor connection requests before they become
            active conversations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChatRequestsTable requests={chatRequestsWithStartupNames} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversation lifecycle</CardTitle>
          <CardDescription>
            Pending requests become active chats only after a founder or admin accepts
            them. Closed requests remain archived.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            { label: "Pending", count: chatRequests.length },
            { label: "Active", count: activeChats },
            { label: "Closed", count: closedChats },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">
                {item.count}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

    </div>
  );
}
