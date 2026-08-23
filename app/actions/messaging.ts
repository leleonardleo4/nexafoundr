"use server";

import { revalidatePath } from "next/cache";
import { ConversationStatus } from "@prisma/client";

import { getDashboardSessionUser } from "@/lib/dashboard-session";
import { prisma } from "@/lib/prisma";

async function getCurrentDashboardUser() {
  const user = await getDashboardSessionUser();

  if (!user) {
    throw new Error("You must be signed in to use messaging.");
  }

  return user;
}

function assertParticipantRole(role: string, expectedRole: "FOUNDER" | "INVESTOR") {
  if (role !== expectedRole) {
    throw new Error(`Only ${expectedRole.toLowerCase()}s can perform this action.`);
  }
}

async function getConversationParticipant(conversationId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: {
      id: conversationId,
    },
    select: {
      id: true,
      founderId: true,
      investorId: true,
      startupId: true,
      status: true,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found.");
  }

  return conversation;
}

export async function initiateConversation(
  founderId: string,
  investorId: string,
  startupId?: string | null,
) {
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

  const existingConversation = await prisma.conversation.findUnique({
    where: {
      founderId_investorId: {
        founderId: founder.id,
        investorId: investor.id,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (existingConversation?.status === ConversationStatus.ACTIVE) {
    return existingConversation;
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
      startupId: startupId ?? null,
      status: ConversationStatus.PENDING,
    },
    update: {
      startupId: startupId ?? null,
      status: ConversationStatus.PENDING,
    },
  });
}

export async function requestConnection(startupId: string) {
  if (!startupId) {
    throw new Error("A startup is required.");
  }

  const currentUser = await getCurrentDashboardUser();
  assertParticipantRole(currentUser.role, "INVESTOR");

  const startup = await prisma.startup.findUnique({
    where: {
      id: startupId,
    },
    select: {
      id: true,
      founderId: true,
      verificationStatus: true,
    },
  });

  if (!startup) {
    throw new Error("Startup not found.");
  }

  if (startup.verificationStatus !== "VERIFIED") {
    throw new Error("Only verified startups can receive connection requests.");
  }

  if (startup.founderId === currentUser.id) {
    throw new Error("You cannot request a connection to your own startup.");
  }

  await initiateConversation(startup.founderId, currentUser.id, startup.id);

  revalidatePath("/investor");
  revalidatePath("/investor/startups");
  revalidatePath(`/investor/startups/${startup.id}`);
  revalidatePath("/founder");
}

export async function acceptConnectionRequest(conversationId: string) {
  if (!conversationId) {
    throw new Error("A conversation is required.");
  }

  const currentUser = await getCurrentDashboardUser();
  const conversation = await getConversationParticipant(conversationId);

  if (currentUser.role !== "ADMIN" && currentUser.id !== conversation.founderId) {
    throw new Error("Only the founder can accept this connection request.");
  }

  if (conversation.status !== ConversationStatus.PENDING) {
    throw new Error("Only pending requests can be accepted.");
  }

  await prisma.conversation.update({
    where: {
      id: conversation.id,
    },
    data: {
      status: ConversationStatus.ACTIVE,
    },
  });

  revalidatePath("/founder");
  revalidatePath("/investor");
}

export async function declineConnectionRequest(conversationId: string) {
  if (!conversationId) {
    throw new Error("A conversation is required.");
  }

  const currentUser = await getCurrentDashboardUser();
  const conversation = await getConversationParticipant(conversationId);

  if (currentUser.role !== "ADMIN" && currentUser.id !== conversation.founderId) {
    throw new Error("Only the founder can decline this connection request.");
  }

  if (conversation.status !== ConversationStatus.PENDING) {
    throw new Error("Only pending requests can be declined.");
  }

  await prisma.conversation.update({
    where: {
      id: conversation.id,
    },
    data: {
      status: ConversationStatus.CLOSED,
    },
  });

  revalidatePath("/founder");
  revalidatePath("/investor");
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
      status: true,
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

  if (conversation.status !== ConversationStatus.ACTIVE) {
    throw new Error("Conversation must be ACTIVE before messages can be sent.");
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
