import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { getDashboardSessionUser } from "@/lib/dashboard-session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getDashboardSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "INVESTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get("name")?.trim();
  const industry = searchParams.get("industry")?.trim();
  const stage = searchParams.get("stage")?.trim();

  const where: Prisma.StartupWhereInput = {
    verificationStatus: "VERIFIED",
    ...(name
      ? {
          name: {
            contains: name,
            mode: "insensitive",
          },
        }
      : {}),
    ...(industry
      ? {
          industry: {
            contains: industry,
            mode: "insensitive",
          },
        }
      : {}),
    ...(stage
      ? {
          stage: {
            contains: stage,
            mode: "insensitive",
          },
        }
      : {}),
  };

  const startups = await prisma.startup.findMany({
    where,
    select: {
      id: true,
      name: true,
      description: true,
      industry: true,
      stage: true,
      fundingRequired: true,
      equityOffered: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json({ startups });
}
