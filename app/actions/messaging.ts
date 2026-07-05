"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDashboardRole } from "@/lib/utils";

async function getCurrentDashboardUser() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    throw new Error("You must be signed in to use messaging.");
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
    throw new Error("You do not have access to messaging.");
  }

  return user;
}

export async function initiateConversation(founderId: string, investorId: string) {
  if (!founderId || !investorId) {
    throw new Error("Founder and investor are required.");
  }

  if (founderId === investorId) {
    throw new Error("A conversation requires two different users.");
  }

  const currentUser = await getCurrentDashboardUser();

  if (
    currentUser.role !== "ADMIN" &&
    currentUser.id !== founderId &&
    currentUser.id !== investorId
  ) {
    throw new Error("You can only initiate conversations you participate in.");
  }

  const [founder, investor] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: founderId,
      },
      select: {
        id: true,
        role: true,
      },
    }),
    prisma.user.findUnique({
      where: {
        id: investorId,
      },
      select: {
        id: true,
        role: true,
      },
    }),
  ]);

  if (!founder || founder.role !== "FOUNDER") {
    throw new Error("A valid founder is required.");
  }

  if (!investor || investor.role !== "INVESTOR") {
    throw new Error("A valid investor is required.");
  }

  return prisma.conversation.upsert({
    where: {
      founderId_investorId: {
        founderId: founder.id,
        investorId: investor.id,
      },
    },
    create: {
      founderId: founder.id,
      investorId: investor.id,
    },
    update: {},
  });
}

export async function sendMessage(conversationId: string, content: string) {
  const trimmedContent = content.trim();

  if (!conversationId) {
    throw new Error("A conversation is required.");
  }

  if (!trimmedContent) {
    throw new Error("Message content is required.");
  }

  const currentUser = await getCurrentDashboardUser();

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
    throw new Error("Conversation not found.");
  }

  if (
    currentUser.role !== "ADMIN" &&
    currentUser.id !== conversation.founderId &&
    currentUser.id !== conversation.investorId
  ) {
    throw new Error("You can only send messages in your conversations.");
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: currentUser.id,
      content: trimmedContent,
    },
  });

  await prisma.conversation.update({
    where: {
      id: conversation.id,
    },
    data: {
      updatedAt: new Date(),
    },
  });

  revalidatePath("/founder");
  revalidatePath("/investor");

  return message;
}
