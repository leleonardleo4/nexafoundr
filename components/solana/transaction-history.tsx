"use client";

import * as React from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { getEscrowPda } from "@/lib/escrow";

type TransactionHistoryProps = {
  investmentId: string;
  investorWalletAddress: string | null;
  escrowAddress: string | null;
};

type SignatureRow = {
  signature: string;
  slot: number;
  blockTime?: number | null;
  confirmationStatus?: string | null;
  err: unknown;
};

function formatBlockTime(blockTime: number | null | undefined) {
  if (!blockTime) {
    return "Pending";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(blockTime * 1000));
}

function resolveEscrowAddress(
  escrowAddress: string | null,
  investorWalletAddress: string | null,
  investmentId: string,
) {
  if (escrowAddress) {
    return new PublicKey(escrowAddress);
  }

  if (!investorWalletAddress) {
    return null;
  }

  return getEscrowPda(new PublicKey(investorWalletAddress), investmentId)[0];
}

export function TransactionHistory({
  investmentId,
  investorWalletAddress,
  escrowAddress,
}: TransactionHistoryProps) {
  const { connection } = useConnection();
  const [rows, setRows] = React.useState<SignatureRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const loadTransactions = React.useCallback(async () => {
    setIsLoading(true);

    try {
      const address = resolveEscrowAddress(
        escrowAddress,
        investorWalletAddress,
        investmentId,
      );

      if (!address) {
        setRows([]);
        return;
      }

      const signatures = await connection.getSignaturesForAddress(address, {
        limit: 10,
      });

      setRows(signatures);
    } catch (error) {
      toast({
        title: "Could not load escrow transactions",
        description:
          error instanceof Error
            ? error.message
            : "Unable to query Solana transaction history.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [connection, escrowAddress, investmentId, investorWalletAddress]);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadTransactions();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadTransactions]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle>Escrow transaction history</CardTitle>
          <CardDescription>
            Recent Devnet signatures related to this investment escrow PDA.
          </CardDescription>
        </div>
        <Button
          type="button"
          onClick={loadTransactions}
          disabled={isLoading}
          className="border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent>
        {rows.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Signature</TableHead>
                <TableHead>Slot</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.signature}>
                  <TableCell className="max-w-[220px] truncate font-mono text-xs">
                    {row.signature}
                  </TableCell>
                  <TableCell>{row.slot}</TableCell>
                  <TableCell>
                    <Badge>{row.err ? "FAILED" : row.confirmationStatus ?? "OK"}</Badge>
                  </TableCell>
                  <TableCell>{formatBlockTime(row.blockTime)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="rounded-md border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-500">
              {isLoading
                ? "Loading escrow transactions..."
                : "No escrow transactions found yet."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
