"use server";

import { getSorsaTwitterProfile } from "@/lib/sorsa";

export type TwitterSignupProfile = {
  username: string;
  displayName: string | null;
  profileImageUrl: string | null;
  bio: string | null;
};

export async function ingestTwitterSignupProfile(username: string): Promise<TwitterSignupProfile> {
  const profile = await getSorsaTwitterProfile(username);
  const profileImageUrl = profile.profile_picture_url ?? profile.avatar_url ?? null;
  const displayName = profile.name ?? null;

  return {
    username: profile.username?.replace(/^@/, "") ?? username.replace(/^@/, ""),
    displayName,
    profileImageUrl,
    bio: profile.bio ?? null,
  };
}
