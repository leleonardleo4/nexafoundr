"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { approveInvestment } from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";

type PendingInvestment = {
  id: string;
  amount: number;
  startup: {
    name: string;
    founder: {
      name: string;
      email: string;
    };
  };
  investor: {
    name: string;
    email: string;
  };
};

type PendingInvestmentsTableProps = {
  investments: PendingInvestment[];
};

export function PendingInvestmentsTable({ investments }: PendingInvestmentsTableProps) {
  const router = useRouter();
  const [pendingInvestmentId, setPendingInvestmentId] = React.useState<string | null>(null);

  function handleApprove(investmentId: string) {
    setPendingInvestmentId(investmentId);

    approveInvestment(investmentId)
      .then(() => {
        toast({
          title: "Investment approved",
          description: "The investment status has been updated to funded.",
        });
        router.refresh();
      })
      .catch((error) => {
        toast({
          title: "Action failed",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setPendingInvestmentId(null);
      });
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Startup</TableHead>
            <TableHead>Founder</TableHead>
            <TableHead>Investor</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {investments.length > 0 ? (
            investments.map((investment) => {
              const rowPending = pendingInvestmentId === investment.id;

              return (
                <TableRow key={investment.id}>
                  <TableCell className="font-medium text-zinc-950 dark:text-zinc-50">
                    {investment.startup.name}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p>{investment.startup.founder.name}</p>
                      <p className="text-xs text-zinc-500">
                        {investment.startup.founder.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p>{investment.investor.name}</p>
                      <p className="text-xs text-zinc-500">{investment.investor.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>NGN {investment.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge>Pending</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        disabled={rowPending}
                        onClick={() => handleApprove(investment.id)}
                      >
                        {rowPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        {rowPending ? "Approving..." : "Approve"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-zinc-500">
                No pending investments awaiting approval.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
