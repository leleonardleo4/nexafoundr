"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { uploadStartupDocument } from "@/lib/cloudinary";
import { getDashboardSessionUser } from "@/lib/dashboard-session";
import { prisma } from "@/lib/prisma";
import {
  investmentSchema,
  startupSchema,
  startupVerificationSchema,
} from "@/lib/validations";

const ALLOWED_DOCUMENT_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".rtf", ".odt"]);
const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/rtf",
  "application/vnd.oasis.opendocument.text",
]);

function isAllowedDocumentFile(file: File) {
  const fileName = file.name.toLowerCase();

  return (
    ALLOWED_DOCUMENT_MIME_TYPES.has(file.type) ||
    Array.from(ALLOWED_DOCUMENT_EXTENSIONS).some((extension) =>
      fileName.endsWith(extension),
    )
  );
}

async function getCurrentDashboardUser(requiredRole?: "FOUNDER" | "INVESTOR") {
  const user = await getDashboardSessionUser();

  if (!user) {
    throw new Error("You must be signed in.");
  }

  if (requiredRole && user.role !== requiredRole) {
    throw new Error(`Only ${requiredRole.toLowerCase()}s can perform this action.`);
  }

  return user;
}

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
  await getCurrentDashboardUser("INVESTOR");

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
  const user = await getCurrentDashboardUser("FOUNDER");

  const founderProfile = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      founderWalletAddress: true,
    },
  });

  if (!founderProfile?.founderWalletAddress) {
    throw new Error("Connect and save your founder wallet before creating a startup listing.");
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

  const user = await getCurrentDashboardUser("FOUNDER");

  const founderProfile = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      founderWalletAddress: true,
    },
  });

  if (!founderProfile?.founderWalletAddress) {
    throw new Error("Connect and save your founder wallet before submitting for verification.");
  }

  if (!(pitchDeck instanceof File) || pitchDeck.size === 0) {
    throw new Error("Pitch deck upload is required.");
  }

  if (!(cacRegistration instanceof File) || cacRegistration.size === 0) {
    throw new Error("CAC registration upload is required.");
  }

  if (!isAllowedDocumentFile(cacRegistration)) {
    throw new Error("CAC registration must be a PDF or document file.");
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

export async function createInvestment(
  startupId: string,
  amount: number,
  investorWalletAddress: string,
) {
  if (!startupId) {
    throw new Error("A startup is required.");
  }

  if (!investorWalletAddress?.trim()) {
    throw new Error("Connect your wallet before creating an investment.");
  }

  const parsedInvestment = investmentSchema.parse({ amount });

  const investor = await getCurrentDashboardUser("INVESTOR");

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
      status: "PENDING_DEPOSIT",
      investorWalletAddress: investorWalletAddress.trim(),
    },
  });

  revalidatePath("/investor");
  revalidatePath("/investor/investments");
  revalidatePath(`/investor/startups/${startup.id}`);

  return investment;
}

type FinalizeInvestmentFundingInput = {
  investmentId: string;
  escrowAddress: string;
  investorWalletAddress: string;
  creditedLamports: string;
  founderWalletAddress?: string | null;
  milestoneAuthorityAddress?: string | null;
};

export async function finalizeInvestmentFunding({
  investmentId,
  escrowAddress,
  investorWalletAddress,
  creditedLamports,
  founderWalletAddress,
  milestoneAuthorityAddress,
}: FinalizeInvestmentFundingInput) {
  if (!investmentId) {
    throw new Error("An investment is required.");
  }

  if (!escrowAddress) {
    throw new Error("An escrow address is required.");
  }

  if (!investorWalletAddress) {
    throw new Error("An investor wallet address is required.");
  }

  const parsedCreditedLamports = BigInt(creditedLamports);

  if (parsedCreditedLamports <= BigInt(0)) {
    throw new Error("A valid credited lamport amount is required.");
  }

  const investor = await getCurrentDashboardUser("INVESTOR");

  const investment = await prisma.investment.findUnique({
    where: {
      id: investmentId,
    },
    select: {
      id: true,
      investorId: true,
      status: true,
      startupId: true,
      amount: true,
      startup: {
        select: {
          verificationStatus: true,
          founderId: true,
        },
      },
    },
  });

  if (!investment) {
    throw new Error("Investment not found.");
  }

  if (investment.investorId !== investor.id) {
    throw new Error("You can only confirm your own investment.");
  }

  if (investment.startup.verificationStatus !== "VERIFIED") {
    throw new Error("Only verified startups can receive investments.");
  }

  if (investment.status !== "PENDING_DEPOSIT") {
    throw new Error("Only investments awaiting deposit can be confirmed.");
  }

  const updatedInvestment = await prisma.investment.update({
    where: {
      id: investment.id,
    },
    data: {
      status: "FUNDED",
      escrowAddress,
      investorWalletAddress,
      founderWalletAddress: founderWalletAddress?.trim() || null,
      milestoneAuthorityAddress: milestoneAuthorityAddress?.trim() || null,
    },
  });

  await prisma.founderWalletBalance.upsert({
    where: {
      founderId: investment.startup.founderId,
    },
    create: {
      founderId: investment.startup.founderId,
      creditedLamports: parsedCreditedLamports,
    },
    update: {
      creditedLamports: {
        increment: parsedCreditedLamports,
      },
    },
  });

  revalidatePath("/investor");
  revalidatePath("/investor/investments");
  revalidatePath(`/investor/startups/${investment.startupId}`);
  revalidatePath("/founder");
  revalidatePath("/founder/investments");

  return updatedInvestment;
}

export async function toggleSavedStartup(startupId: string) {
  if (!startupId) {
    throw new Error("A startup is required.");
  }

  const investor = await getCurrentDashboardUser("INVESTOR");

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
