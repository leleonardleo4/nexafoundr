import type { DashboardSessionUser } from "@/lib/dashboard-session";
import { prisma } from "@/lib/prisma";

type NotificationTone = "message" | "request" | "payment" | "admin";

export type DashboardNotification = {
  id: string;
  title: string;
  description: string;
  href: string;
  tone: NotificationTone;
};

export type DashboardNotificationFeed = {
  items: DashboardNotification[];
  unreadCount: number;
};

function formatRelativeTime(date: Date) {
  const now = Date.now();
  const diffInMinutes = Math.max(1, Math.round((now - date.getTime()) / 60000));

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.round(diffInMinutes / 60);

  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.round(diffInHours / 24);
  return `${diffInDays}d ago`;
}

async function getFounderNotifications(user: DashboardSessionUser): Promise<DashboardNotificationFeed> {
  const [pendingRequests, unreadMessages, recentPayments] = await Promise.all([
    prisma.conversation.findMany({
      where: {
        founderId: user.id,
        status: "PENDING",
      },
      include: {
        investor: {
          select: {
            name: true,
          },
        },
        startup: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
    }),
    prisma.message.findMany({
      where: {
        readAt: null,
        senderId: {
          not: user.id,
        },
        conversation: {
          founderId: user.id,
        },
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        conversationId: true,
        sender: {
          select: {
            name: true,
          },
        },
        conversation: {
          select: {
            startup: {
              select: {
                name: true,
              },
            },
            investor: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
    }),
    prisma.investment.findMany({
      where: {
        startup: {
          founderId: user.id,
        },
      },
      select: {
        id: true,
        amount: true,
        status: true,
        startup: {
          select: {
            name: true,
          },
        },
        investor: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
      take: 3,
    }),
  ]);

  const items: DashboardNotification[] = [
    ...pendingRequests.map((request) => ({
      id: `request-${request.id}`,
      title: "Connection request waiting",
      description: `${request.investor.name} wants to chat about ${request.startup?.name ?? "your startup"}.`,
      href: `/messages/${request.id}`,
      tone: "request" as const,
    })),
    ...unreadMessages.map((message) => ({
      id: `message-${message.id}`,
      title: `${message.sender.name} sent a DM`,
      description: `${message.conversation.startup?.name ?? "Conversation"} · ${message.content.slice(0, 80)}${
        message.content.length > 80 ? "…" : ""
      } · ${formatRelativeTime(message.createdAt)}`,
      href: `/messages/${message.conversationId}`,
      tone: "message" as const,
    })),
    ...recentPayments.map((investment) => ({
      id: `payment-${investment.id}`,
      title: "Investment activity",
      description: `${investment.investor.name} invested USD ${investment.amount.toLocaleString()} in ${investment.startup.name} · ${investment.status}`,
      href: "/founder/investments",
      tone: "payment" as const,
    })),
  ];

  return {
    items: items.slice(0, 6),
    unreadCount: items.length,
  };
}

async function getInvestorNotifications(user: DashboardSessionUser): Promise<DashboardNotificationFeed> {
  const [pendingRequests, unreadMessages, recentInvestments] = await Promise.all([
    prisma.conversation.findMany({
      where: {
        investorId: user.id,
        status: "PENDING",
      },
      include: {
        founder: {
          select: {
            name: true,
          },
        },
        startup: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
    }),
    prisma.message.findMany({
      where: {
        readAt: null,
        senderId: {
          not: user.id,
        },
        conversation: {
          investorId: user.id,
        },
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        conversationId: true,
        sender: {
          select: {
            name: true,
          },
        },
        conversation: {
          select: {
            startup: {
              select: {
                name: true,
              },
            },
            founder: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
    }),
    prisma.investment.findMany({
      where: {
        investorId: user.id,
      },
      select: {
        id: true,
        amount: true,
        status: true,
        startup: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
      take: 3,
    }),
  ]);

  const items: DashboardNotification[] = [
    ...pendingRequests.map((request) => ({
      id: `request-${request.id}`,
      title: "Connection request pending",
      description: `${request.startup?.name ?? "A startup"} is waiting for founder review.`,
      href: `/messages/${request.id}`,
      tone: "request" as const,
    })),
    ...unreadMessages.map((message) => ({
      id: `message-${message.id}`,
      title: `${message.sender.name} sent a DM`,
      description: `${message.conversation.startup?.name ?? "Conversation"} · ${message.content.slice(0, 80)}${
        message.content.length > 80 ? "…" : ""
      } · ${formatRelativeTime(message.createdAt)}`,
      href: `/messages/${message.conversationId}`,
      tone: "message" as const,
    })),
    ...recentInvestments.map((investment) => ({
      id: `investment-${investment.id}`,
      title: "Investment tracked",
      description: `${investment.startup.name} · USD ${investment.amount.toLocaleString()} · ${investment.status}`,
      href: "/investor/investments",
      tone: "payment" as const,
    })),
  ];

  return {
    items: items.slice(0, 6),
    unreadCount: items.length,
  };
}

async function getAdminNotifications(): Promise<DashboardNotificationFeed> {
  const [pendingStartups, pendingChats] = await Promise.all([
    prisma.startup.findMany({
      where: {
        verificationStatus: "PENDING",
      },
      include: {
        founder: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
      take: 3,
    }),
    prisma.conversation.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        founder: {
          select: {
            name: true,
          },
        },
        investor: {
          select: {
            name: true,
          },
        },
        startup: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
      take: 3,
    }),
  ]);

  const items: DashboardNotification[] = [
    ...pendingStartups.map((startup) => ({
      id: `startup-${startup.id}`,
      title: "Startup waiting for review",
      description: `${startup.name} by ${startup.founder.name} is pending verification.`,
      href: `/admin/verification/${startup.id}`,
      tone: "admin" as const,
    })),
    ...pendingChats.map((conversation) => ({
      id: `chat-${conversation.id}`,
      title: "Chat request pending",
      description: `${conversation.investor.name} wants to connect with ${conversation.founder.name}.`,
      href: "/admin#chat-requests",
      tone: "request" as const,
    })),
  ];

  return {
    items: items.slice(0, 6),
    unreadCount: items.length,
  };
}

export async function getDashboardNotifications(
  user: DashboardSessionUser,
): Promise<DashboardNotificationFeed> {
  if (user.role === "FOUNDER") {
    return getFounderNotifications(user);
  }

  if (user.role === "INVESTOR") {
    return getInvestorNotifications(user);
  }

  return getAdminNotifications();
}
