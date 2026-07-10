"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { notifyFounderVerificationStatus } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/utils";
import { verificationStatusSchema } from "@/lib/validations";

async function updateStartupVerificationStatus(
  startupId: string,
  verificationStatus: "VERIFIED" | "REJECTED",
) {
  const parsedVerificationStatus = verificationStatusSchema.parse(verificationStatus);
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    throw new Error("You must be signed in as an admin.");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      role: true,
    },
  });

  if (!user || !isAdminRole(user.role)) {
    throw new Error("Only admins can update verification status.");
  }

  const startup = await prisma.startup.findUnique({
    where: {
      id: startupId,
    },
    select: {
      id: true,
      name: true,
      verificationStatus: true,
      founder: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!startup) {
    throw new Error("Startup not found.");
  }

  if (startup.verificationStatus !== "PENDING") {
    throw new Error("Only pending startups can be reviewed.");
  }

  const updatedStartup = await prisma.startup.update({
    where: {
      id: startup.id,
    },
    data: {
      verificationStatus: parsedVerificationStatus,
    },
  });

  revalidatePath("/founder");
  revalidatePath("/founder/startups");
  revalidatePath("/admin");
  revalidatePath(`/admin/verification/${startup.id}`);
  revalidatePath("/investor/startups");
  revalidatePath("/investor");

  await notifyFounderVerificationStatus({
    founderEmail: startup.founder.email,
    founderName: startup.founder.name,
    startupName: startup.name,
    status: parsedVerificationStatus,
  });

  return updatedStartup;
}

export async function approveStartup(startupId: string) {
  return updateStartupVerificationStatus(startupId, "VERIFIED");
}

export async function rejectStartup(startupId: string) {
  return updateStartupVerificationStatus(startupId, "REJECTED");
}
