"use server";

const SORSA_API_BASE_URL = "https://api.sorsa.io/v3";

export type SorsaUserInfo = {
  id?: string;
  username?: string | null;
  name?: string | null;
  bio?: string | null;
  followers_count?: number | null;
  following_count?: number | null;
  verified?: boolean | null;
  profile_picture_url?: string | null;
  avatar_url?: string | null;
};

function getSorsaApiKey() {
  const apiKey = process.env.SORSA_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Set SORSA_API_KEY in your environment before using Sorsa.");
  }

  return apiKey;
}

async function fetchSorsaV3<T>(path: string) {
  const response = await fetch(`${SORSA_API_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      ApiKey: getSorsaApiKey(),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Sorsa request failed with status ${response.status}${body ? `: ${body}` : ""}`,
    );
  }

  return response.json() as Promise<T>;
}

export async function getSorsaTwitterProfile(username: string) {
  const handle = username.trim().replace(/^@/, "");

  if (!handle) {
    throw new Error("A Twitter username is required.");
  }

  return fetchSorsaV3<SorsaUserInfo>(`/info?username=${encodeURIComponent(handle)}`);
}
