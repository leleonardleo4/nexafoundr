import { NextResponse } from "next/server";

import { getDashboardSessionUser } from "@/lib/dashboard-session";
import { buildDemoDayChecklistSnapshot } from "@/lib/demo-day-state";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getDashboardSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "INVESTOR") {
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
