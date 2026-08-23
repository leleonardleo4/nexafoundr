import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardPath } from "@/lib/utils";
import { requireDashboardSessionUser } from "@/lib/dashboard-session";
import { prisma } from "@/lib/prisma";

function getStatusClassName(status: string) {
  switch (status) {
    case "ACTIVE":
      return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300";
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
    case "CLOSED":
      return "border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--foreground)]";
    default:
      return "border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--foreground)]";
  }
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function MessagesPage() {
  const user = await requireDashboardSessionUser();

  const conversations = await prisma.conversation.findMany({
    where:
      user.role === "ADMIN"
        ? undefined
        : {
            OR: [{ founderId: user.id }, { investorId: user.id }],
          },
    select: {
      id: true,
      status: true,
      updatedAt: true,
      createdAt: true,
      founderId: true,
      investorId: true,
      founder: {
        select: {
          id: true,
          name: true,
        },
      },
      investor: {
        select: {
          id: true,
          name: true,
        },
      },
      startup: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
            Messages
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[color:var(--foreground)]">
            Conversation inbox
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[color:var(--muted-foreground)]">
            Track connection requests, active chats, and closed conversations in
            one place.
          </p>
        </div>

        <Button asChild>
          <Link href={getDashboardPath(user.role)}>Back to dashboard</Link>
        </Button>
      </section>

      <Card>
        <CardHeader>
          <CardDescription>Peer-to-peer communication</CardDescription>
          <CardTitle>Your conversations</CardTitle>
        </CardHeader>
        <CardContent>
          {conversations.length > 0 ? (
            <div className="space-y-4">
              {conversations.map((conversation) => {
                const otherParticipant =
                  user.id === conversation.founderId
                    ? conversation.investor
                    : conversation.founder;

                return (
                  <div
                    key={conversation.id}
                    className="flex flex-col gap-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-base font-semibold text-[color:var(--foreground)]">
                          {conversation.startup?.name ?? otherParticipant.name}
                        </h3>
                        <Badge className={getStatusClassName(conversation.status)}>
                          {conversation.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-[color:var(--muted-foreground)]">
                        {otherParticipant.name}
                      </p>
                      <p className="text-xs text-[color:var(--muted-foreground)]">
                        Updated {formatDate(conversation.updatedAt)}
                      </p>
                    </div>

                    <Button asChild>
                      <Link href={`/messages/${conversation.id}`}>
                        {conversation.status === "ACTIVE" ? "Open chat room" : "Review request"}
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface-strong)] p-6 text-center">
              <p className="text-sm text-[color:var(--muted-foreground)]">
                You do not have any conversations yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
