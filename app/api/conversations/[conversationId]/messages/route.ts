import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDashboardRole } from "@/lib/utils";

type ConversationMessagesRouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: ConversationMessagesRouteContext,
) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
