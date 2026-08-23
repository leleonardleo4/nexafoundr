import { NextResponse } from "next/server";

import { getDashboardSessionUser } from "@/lib/dashboard-session";
import { prisma } from "@/lib/prisma";

type ConversationMessagesRouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: ConversationMessagesRouteContext,
) {
  const user = await getDashboardSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const isParticipant =
    user.id === conversation.founderId || user.id === conversation.investorId;

  if (user.role !== "ADMIN" && !isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (conversation.status !== "ACTIVE" && user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Conversation is not active yet." },
      { status: 409 },
    );
  }

  const messages = await prisma.message.findMany({
    where: {
      conversationId: conversation.id,
    },
    select: {
      id: true,
      conversationId: true,
      senderId: true,
      content: true,
      readAt: true,
      createdAt: true,
      sender: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return NextResponse.json({
    conversationId: conversation.id,
    messages,
  });
}
