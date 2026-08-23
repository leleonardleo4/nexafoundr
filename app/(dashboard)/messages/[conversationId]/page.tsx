import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ConversationRoom } from "@/components/messaging/conversation-room";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardPath } from "@/lib/utils";
import { requireDashboardSessionUser } from "@/lib/dashboard-session";
import { prisma } from "@/lib/prisma";

type ConversationPageProps = {
  params: Promise<{
    conversationId: string;
  }>;
};

export default async function ConversationPage({ params }: ConversationPageProps) {
  const user = await requireDashboardSessionUser();
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
      <section className="flex flex-col gap-4 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
            Private conversation
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[color:var(--foreground)]">
            {roomTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[color:var(--muted-foreground)]">
            {roomDescription}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge>{conversation.status}</Badge>
          {conversation.startup ? (
            <Button
              asChild
              className="bg-[color:var(--secondary)] text-[color:var(--secondary-foreground)] hover:bg-[color:var(--secondary-hover)]"
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
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">Founder</p>
              <p className="mt-2 text-sm font-medium text-[color:var(--foreground)]">
                {conversation.founder.name}
              </p>
              <p className="text-sm text-[color:var(--muted-foreground)]">
                {conversation.founder.email}
              </p>
            </div>

            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">Investor</p>
              <p className="mt-2 text-sm font-medium text-[color:var(--foreground)]">
                {conversation.investor.name}
              </p>
              <p className="text-sm text-[color:var(--muted-foreground)]">
                {conversation.investor.email}
              </p>
            </div>

            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">Created</p>
              <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
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
