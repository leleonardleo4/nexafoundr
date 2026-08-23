"use server";

import { revalidatePath } from "next/cache";
import { PublicKey } from "@solana/web3.js";

import { uploadStartupDocument } from "@/lib/cloudinary";
import { getDashboardSessionUser, setDashboardSession } from "@/lib/dashboard-session";
import { prisma } from "@/lib/prisma";

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

function parseProfileName(value: FormDataEntryValue | null) {
  const rawValue = typeof value === "string" ? value.trim() : "";

  if (!rawValue) {
    throw new Error("Enter your display name.");
  }

  return rawValue;
}

function parseAvatarFile(value: FormDataEntryValue | null) {
  if (!value || typeof value === "string" || value.size === 0) {
    return null;
  }

  if (!value.type.startsWith("image/")) {
    throw new Error("Upload a PNG, JPG, JPEG, or WebP avatar image.");
  }

  return value;
}

export async function updateFounderWalletAddress(formData: FormData) {
  const user = await getDashboardSessionUser();

  if (!user) {
    throw new Error("You must be signed in to update your wallet address.");
  }

  const founder = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      id: true,
      role: true,
      founderWalletAddress: true,
      email: true,
      name: true,
      profileImage: true,
      image: true,
    },
  });

  if (!founder || founder.role !== "FOUNDER") {
    throw new Error("Only founders can update the founder wallet address.");
  }

  const founderWalletAddress = parseFounderWalletAddress(
    formData.get("founderWalletAddress"),
  );

  const updatedUser = await prisma.user.update({
    where: {
      id: founder.id,
    },
    data: {
      founderWalletAddress,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      founderWalletAddress: true,
      profileImage: true,
      image: true,
    },
  });

  await setDashboardSession({
    userId: updatedUser.id,
    email: updatedUser.email,
    role: updatedUser.role,
    name: updatedUser.name,
    walletAddress: updatedUser.founderWalletAddress ?? null,
  });

  revalidatePath("/settings");
  revalidatePath("/founder");
  revalidatePath("/founder/startups");
  revalidatePath("/investor");
  revalidatePath("/investor/startups");

  return updatedUser;
}

export async function completeWalletOnboarding(walletAddress: string | null | undefined) {
  const user = await getDashboardSessionUser();

  if (!user) {
    throw new Error("You must be signed in to update your wallet onboarding status.");
  }

  const normalizedWalletAddress = typeof walletAddress === "string" ? walletAddress.trim() : "";

  if (!normalizedWalletAddress) {
    throw new Error("Connect your wallet before finishing setup.");
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      founderWalletAddress: normalizedWalletAddress,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      founderWalletAddress: true,
      profileImage: true,
      image: true,
    },
  });

  await setDashboardSession({
    userId: updatedUser.id,
    email: updatedUser.email,
    role: updatedUser.role,
    name: updatedUser.name,
    walletAddress: updatedUser.founderWalletAddress ?? normalizedWalletAddress,
  });

  revalidatePath("/settings");
  revalidatePath("/founder");
  revalidatePath("/founder/startups");
  revalidatePath("/investor");
  revalidatePath("/investor/startups");

  return updatedUser;
}

export async function updateProfileSettings(formData: FormData) {
  const user = await getDashboardSessionUser();

  if (!user) {
    throw new Error("You must be signed in to update your profile.");
  }

  const name = parseProfileName(formData.get("name"));
  const avatarFile = parseAvatarFile(formData.get("avatar"));
  const currentAvatar = user.profileImage ?? user.image ?? null;

  let avatarUrl = currentAvatar;

  if (avatarFile) {
    const uploadedAvatar = await uploadStartupDocument({
      file: avatarFile,
      folder: "nexafoundr/profile-avatars",
      publicIdPrefix: `avatar-${user.id}`,
    });

    avatarUrl = uploadedAvatar?.secure_url ?? currentAvatar;
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      name,
      profileImage: avatarUrl,
      image: avatarUrl,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      founderWalletAddress: true,
      profileImage: true,
      image: true,
    },
  });

  await setDashboardSession({
    userId: updatedUser.id,
    email: updatedUser.email,
    role: updatedUser.role,
    name: updatedUser.name,
    walletAddress: updatedUser.founderWalletAddress ?? null,
  });

  revalidatePath("/settings");
  revalidatePath("/founder");
  revalidatePath("/founder/startups");
  revalidatePath("/investor");
  revalidatePath("/investor/startups");
  revalidatePath("/admin");

  return updatedUser;
}
