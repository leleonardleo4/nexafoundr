import "dotenv/config";

import { Prisma } from "@prisma/client";
import { Keypair } from "@solana/web3.js";

import { prisma } from "../lib/prisma";

type SeedStartupInput = {
  name: string;
  description: string;
  industry: string;
  stage: string;
  fundingRequired: number;
  equityOffered: number;
  websiteUrl?: string;
  teamInformation: Record<string, unknown>;
};

type SeedFounderInput = {
  name: string;
  email: string;
  startupWalletAddress?: string;
  startups: SeedStartupInput[];
};

const founders: SeedFounderInput[] = [
  {
    name: "Amina Bello",
    email: "amina.bello@prop.nexafoundr.local",
    startupWalletAddress: Keypair.generate().publicKey.toBase58(),
    startups: [
      {
        name: "Kora Health",
        description:
          "Affordable clinic financing and claims automation for small healthcare providers.",
        industry: "HealthTech",
        stage: "Seed",
        fundingRequired: 45000000,
        equityOffered: 8,
        websiteUrl: "https://korahealth.example",
        teamInformation: {
          founder: "Amina Bello",
          teamSize: 5,
          focus: "Health financing",
        },
      },
      {
        name: "Mend Market",
        description:
          "A B2B marketplace connecting vetted Nigerian pharmacies with distributors.",
        industry: "Marketplace",
        stage: "Pre-Seed",
        fundingRequired: 28000000,
        equityOffered: 6,
        websiteUrl: "https://mendmarket.example",
        teamInformation: {
          founder: "Amina Bello",
          teamSize: 4,
          focus: "Pharmacy supply chain",
        },
      },
    ],
  },
  {
    name: "Tunde Okafor",
    email: "tunde.okafor@prop.nexafoundr.local",
    startupWalletAddress: Keypair.generate().publicKey.toBase58(),
    startups: [
      {
        name: "FleetStone",
        description:
          "Logistics routing and fleet visibility for regional distributors and commerce teams.",
        industry: "Logistics",
        stage: "Seed",
        fundingRequired: 52000000,
        equityOffered: 7.5,
        websiteUrl: "https://fleetstone.example",
        teamInformation: {
          founder: "Tunde Okafor",
          teamSize: 6,
          focus: "Fleet software",
        },
      },
      {
        name: "RouteMint",
        description:
          "AI-assisted delivery planning for last-mile operators across West Africa.",
        industry: "Logistics",
        stage: "Growth",
        fundingRequired: 76000000,
        equityOffered: 10,
        websiteUrl: "https://routemint.example",
        teamInformation: {
          founder: "Tunde Okafor",
          teamSize: 8,
          focus: "Delivery optimization",
        },
      },
    ],
  },
  {
    name: "Zainab Musa",
    email: "zainab.musa@prop.nexafoundr.local",
    startupWalletAddress: Keypair.generate().publicKey.toBase58(),
    startups: [
      {
        name: "AgroLink",
        description:
          "Farm-to-buyer aggregation platform for verified produce buyers and cooperative farmers.",
        industry: "AgriTech",
        stage: "Seed",
        fundingRequired: 61000000,
        equityOffered: 9,
        websiteUrl: "https://agrolink.example",
        teamInformation: {
          founder: "Zainab Musa",
          teamSize: 7,
          focus: "Agricultural supply chain",
        },
      },
    ],
  },
];

async function upsertFounder(founder: SeedFounderInput) {
  const user = await prisma.user.upsert({
    where: {
      email: founder.email,
    },
    create: {
      name: founder.name,
      email: founder.email,
      role: "FOUNDER",
      founderWalletAddress: founder.startupWalletAddress,
      emailVerified: true,
    },
    update: {
      name: founder.name,
      role: "FOUNDER",
      founderWalletAddress: founder.startupWalletAddress,
      emailVerified: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  for (const startup of founder.startups) {
    const existingStartup = await prisma.startup.findFirst({
      where: {
        founderId: user.id,
        name: startup.name,
      },
      select: {
        id: true,
      },
    });

    const startupData = {
      founderId: user.id,
      name: startup.name,
      description: startup.description,
      industry: startup.industry,
      stage: startup.stage,
      fundingRequired: startup.fundingRequired,
      equityOffered: startup.equityOffered,
      websiteUrl: startup.websiteUrl,
      teamInformation: startup.teamInformation as Prisma.InputJsonValue,
      verificationStatus: "VERIFIED" as const,
    };

    if (existingStartup) {
      await prisma.startup.update({
        where: {
          id: existingStartup.id,
        },
        data: startupData,
      });
      continue;
    }

    await prisma.startup.create({
      data: startupData,
    });
  }

  return user;
}

async function main() {
  const seededFounders = await Promise.all(founders.map((founder) => upsertFounder(founder)));

  console.log(
    `Seeded ${seededFounders.length} founder accounts and ${founders.reduce(
      (count, founder) => count + founder.startups.length,
      0,
    )} verified startups.`,
  );

  for (const founder of seededFounders) {
    console.log(`- ${founder.name} <${founder.email}>`);
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit();
  });
