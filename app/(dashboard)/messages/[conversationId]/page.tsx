import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { ConversationRoom } from "@/components/messaging/conversation-room";
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
      name: true,
      role: true,
    },
  });

  if (!user || !isDashboardRole(user.role)) {
    redirect("/");
  }

  return user;
}

type ConversationPageProps = {
  params: Promise<{
    conversationId: string;
  }>;
};

export default async function ConversationPage({ params }: ConversationPageProps) {
  const user = await getDashboardUser();
  const { conversationId } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: {
      id: conversationId,
    },
    select: {
      id: true,
      founderId: true,
      investorId: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      founder: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      investor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      startup: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!conversation) {
    notFound();
  }

  const isParticipant =
    user.id === conversation.founderId || user.id === conversation.investorId;

  if (user.role !== "ADMIN" && !isParticipant) {
    redirect(getDashboardPath(user.role));
  }

  const messages = await prisma.message.findMany({
    where: {
      conversationId: conversation.id,
    },
    select: {
      id: true,
      senderId: true,
      content: true,
      createdAt: true,
      sender: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const otherParticipant =
    user.id === conversation.founderId ? conversation.investor : conversation.founder;
  const roomTitle = conversation.startup?.name ?? otherParticipant.name;
  const roomDescription =
    conversation.status === "ACTIVE"
      ? `You are chatting with ${otherParticipant.name}.`
      : conversation.status === "PENDING"
        ? "This request is waiting for approval."
        : "This conversation is closed.";

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
            Private conversation
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
            {roomTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            {roomDescription}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge>{conversation.status}</Badge>
          {conversation.startup ? (
            <Button
              asChild
              className="bg-zinc-200 text-zinc-950 hover:bg-zinc-300 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              <Link href={`/investor/startups/${conversation.startup.id}`}>
                View startup
              </Link>
            </Button>
          ) : null}
          <Button asChild>
            <Link href={getDashboardPath(user.role)}>Back to dashboard</Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardDescription>Participants</CardDescription>
            <CardTitle>Who is in this room</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Founder</p>
              <p className="mt-2 text-sm font-medium text-zinc-950 dark:text-zinc-50">
                {conversation.founder.name}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {conversation.founder.email}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Investor</p>
              <p className="mt-2 text-sm font-medium text-zinc-950 dark:text-zinc-50">
                {conversation.investor.name}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {conversation.investor.email}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Created</p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {new Intl.DateTimeFormat(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(conversation.createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>

        <ConversationRoom
          conversationId={conversation.id}
          conversationStatus={conversation.status}
          currentUserId={user.id}
          title={roomTitle}
          description={roomDescription}
          messages={messages}
        />
      </div>
    </div>
  );
}
