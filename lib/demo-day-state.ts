import "server-only";

import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import { Keypair, PublicKey, Connection } from "@solana/web3.js";

import investmentEscrowIdl from "@/anchor/target/idl/investment_escrow.json";
import { prisma } from "@/lib/prisma";
import { getEscrowPda, getInvestmentEscrowProgramId } from "@/lib/escrow";
import { getSolanaRpcEndpoint } from "@/lib/solana-endpoint";

type DemoInvestment = {
  id: string;
  amount: number;
  status: string;
  escrowAddress: string | null;
  investorWalletAddress: string | null;
  founderWalletAddress: string | null;
  startup: {
    id: string;
    name: string;
    industry: string;
    stage: string;
    fundingRequired: number;
  };
};

export type DemoDayChecklistSnapshot = {
  walletConnected: boolean;
  startupFound: boolean;
  funded: boolean;
  milestoneApproved: boolean;
  checkedAt: string;
  activeInvestment: {
    id: string;
    startupName: string;
    status: string;
    amount: number;
    escrowAddress: string | null;
    releasedAmountLamports: number | null;
    milestoneStatus: string | null;
  } | null;
};

export type DemoDayChecklistServerSnapshot = Omit<
  DemoDayChecklistSnapshot,
  "walletConnected"
>;

function createReadOnlyProgram(connection: Connection) {
  const wallet = {
    publicKey: Keypair.generate().publicKey,
    signTransaction: async <T>(transaction: T) => transaction,
    signAllTransactions: async <T>(transactions: T[]) => transactions,
  };

  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });

  const idl = {
    ...investmentEscrowIdl,
    address: getInvestmentEscrowProgramId().toBase58(),
  } as Idl & { address: string };

  return new Program(idl, provider);
}

function asNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (value && typeof value === "object" && "toString" in value) {
    return Number((value as { toString(): string }).toString());
  }

  return Number(value ?? 0);
}

function getEscrowReleaseAmount(state: unknown) {
  if (!state || typeof state !== "object") {
    return 0;
  }

  const record = state as Record<string, unknown>;
  return asNumber(record.releasedAmount ?? record.released_amount ?? 0);
}

function getEscrowStatusLabel(state: unknown) {
  if (!state || typeof state !== "object") {
    return null;
  }

  const record = state as Record<string, unknown>;
  const status = record.status;

  if (typeof status === "string") {
    return status;
  }

  if (status && typeof status === "object") {
    const [variant] = Object.keys(status);
    return variant ?? null;
  }

  return null;
}

async function resolveEscrowStatus(connection: Connection, investment: DemoInvestment) {
  const escrowAddress = investment.escrowAddress
    ? new PublicKey(investment.escrowAddress)
    : investment.investorWalletAddress
      ? getEscrowPda(
          new PublicKey(investment.investorWalletAddress),
          investment.id,
        )[0]
      : null;

  if (!escrowAddress) {
    return {
      escrowAddress: null,
      releasedAmountLamports: null,
      milestoneApproved: false,
      milestoneStatus: null,
    };
  }

  const program = createReadOnlyProgram(connection);
  const escrowAccount = program.account as {
    escrowState: {
      fetchNullable(address: PublicKey): Promise<unknown>;
    };
  };
  const escrowState = await escrowAccount.escrowState.fetchNullable(escrowAddress);

  if (!escrowState) {
    return {
      escrowAddress: escrowAddress.toBase58(),
      releasedAmountLamports: null,
      milestoneApproved: false,
      milestoneStatus: null,
    };
  }

  const releasedAmountLamports = getEscrowReleaseAmount(escrowState);
  const milestoneStatus = getEscrowStatusLabel(escrowState);

  return {
    escrowAddress: escrowAddress.toBase58(),
    releasedAmountLamports,
    milestoneApproved: releasedAmountLamports > 0 || milestoneStatus?.toLowerCase() === "released",
    milestoneStatus,
  };
}

export async function buildDemoDayChecklistSnapshot(
  investorId: string,
  investmentId?: string | null,
) {
  const investments = (await prisma.investment.findMany({
    where: {
      investorId,
    },
    include: {
      startup: {
        select: {
          id: true,
          name: true,
          industry: true,
          stage: true,
          fundingRequired: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  })) as DemoInvestment[];

  const activeInvestment =
    (investmentId
      ? investments.find((investment) => investment.id === investmentId)
      : null) ?? investments[0] ?? null;
  const connection = new Connection(getSolanaRpcEndpoint(), "confirmed");

  const escrowStatus =
    activeInvestment && activeInvestment.investorWalletAddress
      ? await resolveEscrowStatus(connection, activeInvestment)
      : {
          escrowAddress: activeInvestment?.escrowAddress ?? null,
          releasedAmountLamports: null,
          milestoneApproved: false,
          milestoneStatus: null,
        };

  return {
    startupFound: investments.length > 0,
    funded:
      activeInvestment?.status === "FUNDED" || activeInvestment?.status === "RELEASED",
    milestoneApproved: escrowStatus.milestoneApproved,
    checkedAt: new Date().toISOString(),
    activeInvestment: activeInvestment
      ? {
          id: activeInvestment.id,
          startupName: activeInvestment.startup.name,
          status: activeInvestment.status,
          amount: activeInvestment.amount,
          escrowAddress: escrowStatus.escrowAddress,
          releasedAmountLamports: escrowStatus.releasedAmountLamports,
          milestoneStatus: escrowStatus.milestoneStatus,
        }
        : null,
  } satisfies DemoDayChecklistServerSnapshot;
}
