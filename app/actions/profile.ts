"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { PublicKey } from "@solana/web3.js";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDashboardRole } from "@/lib/utils";

function parseFounderWalletAddress(value: FormDataEntryValue | null) {
  const rawValue = typeof value === "string" ? value.trim() : "";

  if (!rawValue) {
    return null;
  }

  try {
    return new PublicKey(rawValue).toBase58();
  } catch {
    throw new Error("Enter a valid Solana wallet address.");
  }
}

export async function updateFounderWalletAddress(formData: FormData) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    throw new Error("You must be signed in to update your wallet address.");
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

  if (!user || !isDashboardRole(user.role) || user.role !== "FOUNDER") {
    throw new Error("Only founders can update the founder wallet address.");
  }

  const founderWalletAddress = parseFounderWalletAddress(
    formData.get("founderWalletAddress"),
  );

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      founderWalletAddress,
    },
    select: {
      founderWalletAddress: true,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/founder");
  revalidatePath("/founder/startups");
  revalidatePath("/investor");
  revalidatePath("/investor/startups");

  return updatedUser;
}
