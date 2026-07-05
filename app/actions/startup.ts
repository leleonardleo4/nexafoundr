"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { uploadStartupDocument } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { isDashboardRole } from "@/lib/utils";
import {
  investmentSchema,
  startupSchema,
  startupVerificationSchema,
} from "@/lib/validations";

export async function getVerifiedStartups() {
  return prisma.startup.findMany({
    where: {
      verificationStatus: "VERIFIED",
    },
    orderBy: {
      name: "asc",
    },
  });
}

export type StartupSearchFilters = {
  name?: string;
  industry?: string;
  stage?: string;
};

export async function searchVerifiedStartups({
  name,
  industry,
  stage,
}: StartupSearchFilters) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    throw new Error("You must be signed in to search startups.");
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
    throw new Error("Only investors can search verified startups.");
  }

  const where: Prisma.StartupWhereInput = {
    verificationStatus: "VERIFIED",
    ...(name?.trim()
      ? {
          name: {
            contains: name.trim(),
            mode: "insensitive",
          },
        }
      : {}),
    ...(industry?.trim()
      ? {
          industry: {
            contains: industry.trim(),
            mode: "insensitive",
          },
        }
      : {}),
    ...(stage?.trim()
      ? {
          stage: {
            contains: stage.trim(),
            mode: "insensitive",
          },
        }
      : {}),
  };

  return prisma.startup.findMany({
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
}

export type StartupListingInput = z.input<typeof startupSchema>;
type ParsedStartupListing = z.output<typeof startupSchema>;

function parseStartupListingInput(
  input: StartupListingInput | FormData,
): ParsedStartupListing {
  if (input instanceof FormData) {
    return startupSchema.parse(Object.fromEntries(input.entries()));
  }

  return startupSchema.parse(input);
}

export async function createStartupListing(input: StartupListingInput | FormData) {
  const listingInput = parseStartupListingInput(input);

  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    throw new Error("You must be signed in to create a startup listing.");
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
    throw new Error("Only founders can create startup listings.");
  }

  const startup = await prisma.startup.create({
    data: {
      founderId: user.id,
      name: listingInput.name,
      description: listingInput.description,
      industry: listingInput.industry,
      stage: listingInput.stage,
      fundingRequired: listingInput.fundingRequired,
      equityOffered: listingInput.equityOffered,
    },
  });

  revalidatePath("/founder");
  revalidatePath("/founder/startups");
  revalidatePath("/investor/startups");
  revalidatePath("/investor");

  return startup;
}

export async function createStartupListingAction(formData: FormData) {
  await createStartupListing(formData);
}

export async function submitStartupForVerification(formData: FormData) {
  const verificationInput = startupVerificationSchema.parse({
    name: formData.get("name"),
    description: formData.get("description"),
    industry: formData.get("industry"),
    stage: formData.get("stage"),
    fundingRequired: formData.get("fundingRequired"),
    equityOffered: formData.get("equityOffered"),
    teamInformation: formData.get("teamInformation"),
    websiteUrl: formData.get("websiteUrl"),
  });
  const pitchDeck = formData.get("pitchDeck");
  const cacRegistration = formData.get("cacRegistration");

  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    throw new Error("You must be signed in to submit a startup for verification.");
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
    throw new Error("Only founders can submit startups for verification.");
  }

  if (!(pitchDeck instanceof File) || pitchDeck.size === 0) {
    throw new Error("Pitch deck upload is required.");
  }

  if (!(cacRegistration instanceof File) || cacRegistration.size === 0) {
    throw new Error("CAC registration upload is required.");
  }

  const startup = await prisma.startup.create({
    data: {
      founderId: user.id,
      name: verificationInput.name,
      description: verificationInput.description,
      industry: verificationInput.industry,
      stage: verificationInput.stage,
      fundingRequired: verificationInput.fundingRequired,
      equityOffered: verificationInput.equityOffered,
      teamInformation: verificationInput.teamInformation as Prisma.InputJsonValue,
      websiteUrl: verificationInput.websiteUrl,
      verificationStatus: "PENDING",
    },
  });

  const [pitchDeckUpload, cacRegistrationUpload] = await Promise.all([
    uploadStartupDocument({
      file: pitchDeck,
      publicIdPrefix: `${startup.id}-pitch-deck`,
    }),
    uploadStartupDocument({
      file: cacRegistration,
      publicIdPrefix: `${startup.id}-cac-registration`,
    }),
  ]);

  await prisma.startupDocuments.create({
    data: {
      startupId: startup.id,
      pitchDeckUrl: pitchDeckUpload?.secure_url,
      cacRegistrationUrl: cacRegistrationUpload?.secure_url,
    },
  });

  revalidatePath("/founder");
  revalidatePath("/founder/startups");
  revalidatePath("/admin");

  return startup;
}

export async function createInvestment(startupId: string, amount: number) {
  if (!startupId) {
    throw new Error("A startup is required.");
  }

  const parsedInvestment = investmentSchema.parse({ amount });

  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    throw new Error("You must be signed in to invest.");
  }

  const investor = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!investor || !isDashboardRole(investor.role) || investor.role !== "INVESTOR") {
    throw new Error("Only investors can create investment records.");
  }

  const startup = await prisma.startup.findUnique({
    where: {
      id: startupId,
    },
    select: {
      id: true,
      founderId: true,
      verificationStatus: true,
    },
  });

  if (!startup) {
    throw new Error("Startup not found.");
  }

  if (startup.verificationStatus !== "VERIFIED") {
    throw new Error("Only verified startups can receive investments.");
  }

  if (startup.founderId === investor.id) {
    throw new Error("You cannot invest in your own startup.");
  }

  const investment = await prisma.investment.create({
    data: {
      startupId: startup.id,
      investorId: investor.id,
      amount: parsedInvestment.amount,
      status: "PENDING",
    },
  });

  revalidatePath("/investor");
  revalidatePath("/investor/investments");
  revalidatePath(`/investor/startups/${startup.id}`);

  return investment;
}

export async function toggleSavedStartup(startupId: string) {
  if (!startupId) {
    throw new Error("A startup is required.");
  }

  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    throw new Error("You must be signed in to save startups.");
  }

  const investor = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!investor || !isDashboardRole(investor.role) || investor.role !== "INVESTOR") {
    throw new Error("Only investors can save startups.");
  }

  const startup = await prisma.startup.findUnique({
    where: {
      id: startupId,
    },
    select: {
      id: true,
      verificationStatus: true,
    },
  });

  if (!startup) {
    throw new Error("Startup not found.");
  }

  if (startup.verificationStatus !== "VERIFIED") {
    throw new Error("Only verified startups can be saved.");
  }

  const existingSavedStartup = await prisma.savedStartup.findUnique({
    where: {
      investorId_startupId: {
        investorId: investor.id,
        startupId: startup.id,
      },
    },
  });

  if (existingSavedStartup) {
    await prisma.savedStartup.delete({
      where: {
        id: existingSavedStartup.id,
      },
    });

    revalidatePath("/investor/startups");
    revalidatePath("/investor");

    return {
      saved: false,
    };
  }

  await prisma.savedStartup.create({
    data: {
      investorId: investor.id,
      startupId: startup.id,
    },
  });

  revalidatePath("/investor/startups");
  revalidatePath("/investor");

  return {
    saved: true,
  };
}
