"use server";

import { revalidatePath } from "next/cache";

import { getDashboardSessionUser } from "@/lib/dashboard-session";
import { notifyFounderVerificationStatus } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { verificationStatusSchema } from "@/lib/validations";

async function updateStartupVerificationStatus(
  startupId: string,
  verificationStatus: "VERIFIED" | "REJECTED",
) {
  const parsedVerificationStatus = verificationStatusSchema.parse(verificationStatus);
  const user = await getDashboardSessionUser();

  if (!user) {
    throw new Error("You must be signed in as an admin.");
  }

  if (user.role !== "ADMIN") {
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
