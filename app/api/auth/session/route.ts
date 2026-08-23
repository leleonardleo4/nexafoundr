import { NextResponse } from "next/server";

import {
  clearDashboardSession,
  getDashboardSessionUser,
} from "@/lib/dashboard-session";

export async function GET() {
  const user = await getDashboardSessionUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}

export async function DELETE() {
  await clearDashboardSession();
  return NextResponse.json({ ok: true });
}
