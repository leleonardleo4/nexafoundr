import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDashboardRole } from "@/lib/utils";

export async function GET(request: NextRequest) {
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
      role: true,
    },
  });

  if (!user || !isDashboardRole(user.role) || user.role !== "INVESTOR") {
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
