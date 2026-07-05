"use client";

import * as React from "react";
import Link from "next/link";
import { Eye } from "lucide-react";

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
type PendingStartup = {
  id: string;
  name: string;
  industry: string;
  stage: string;
  fundingRequired: number;
  founder: {
    name: string;
    email: string;
  };
};

type PendingStartupsTableProps = {
  startups: PendingStartup[];
};

export function PendingStartupsTable({ startups }: PendingStartupsTableProps) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Startup</TableHead>
            <TableHead>Founder</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Funding Goal</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {startups.length > 0 ? (
            startups.map((startup) => (
                <TableRow key={startup.id}>
                  <TableCell className="font-medium text-zinc-950 dark:text-zinc-50">
                    <div className="space-y-1">
                      <p>{startup.name}</p>
                      <p className="text-xs text-zinc-500">{startup.stage}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p>{startup.founder.name}</p>
                      <p className="text-xs text-zinc-500">{startup.founder.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{startup.industry}</TableCell>
                  <TableCell>NGN {startup.fundingRequired.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge>Pending</Badge>
                  </TableCell>
                  <TableCell>
                    <Button asChild>
                      <Link href={`/admin/verification/${startup.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Review
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-zinc-500">
                No pending startups awaiting review.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
