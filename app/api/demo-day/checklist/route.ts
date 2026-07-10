import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { buildDemoDayChecklistSnapshot } from "@/lib/demo-day-state";
import { prisma } from "@/lib/prisma";
import { isDashboardRole } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const investmentId = url.searchParams.get("investmentId");
    const snapshot = await buildDemoDayChecklistSnapshot(user.id, investmentId);

    return NextResponse.json(snapshot);
  } catch {
    return NextResponse.json(
      { error: "Unable to load the demo day checklist state." },
      { status: 500 },
    );
  }
}
