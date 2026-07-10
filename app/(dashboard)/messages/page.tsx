import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getDashboardPath, isDashboardRole } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

async function getDashboardUser() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user || !isDashboardRole(user.role)) {
    redirect("/");
  }

  return user;
}

function getStatusClassName(status: string) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
    case "CLOSED":
      return "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300";
    default:
      return "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300";
  }
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function MessagesPage() {
  const user = await getDashboardUser();

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
      <section className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
            Messages
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
            Conversation inbox
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
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
                    className="flex flex-col gap-4 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                          {conversation.startup?.name ?? otherParticipant.name}
                        </h3>
                        <Badge className={getStatusClassName(conversation.status)}>
                          {conversation.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {otherParticipant.name}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
            <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
              <p className="text-sm text-zinc-500">
                You do not have any conversations yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
