import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDashboardRole } from "@/lib/utils";

export async function POST(request: Request) {
  try {
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

    if (!user || !isDashboardRole(user.role) || user.role !== "INVESTOR") {
      return NextResponse.json(
        { error: "Only investors can create investment records." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      startupId?: string;
      amount?: number;
    };

    if (!body.startupId || !body.amount || Number.isNaN(body.amount) || body.amount <= 0) {
      return NextResponse.json(
        { error: "A valid startup and investment amount are required." },
        { status: 400 },
      );
    }

    const startup = await prisma.startup.findUnique({
      where: {
        id: body.startupId,
      },
      select: {
        id: true,
        founderId: true,
        verificationStatus: true,
      },
    });

    if (!startup) {
      return NextResponse.json({ error: "Startup not found." }, { status: 404 });
    }

    if (startup.verificationStatus !== "VERIFIED") {
      return NextResponse.json(
        { error: "Only verified startups can receive investments." },
        { status: 400 },
      );
    }

    if (startup.founderId === user.id) {
      return NextResponse.json(
        { error: "You cannot invest in your own startup." },
        { status: 400 },
      );
    }

    const investment = await prisma.investment.create({
      data: {
        startupId: startup.id,
        investorId: user.id,
        amount: body.amount,
        status: "PENDING_DEPOSIT",
      },
    });

    return NextResponse.json(
      {
        message: "Investment created successfully.",
        investment,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to create the investment record." },
      { status: 500 },
    );
  }
}
