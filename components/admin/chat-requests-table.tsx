"use client";

import * as React from "react";
import { Check, Loader2, MessageSquareOff } from "lucide-react";

import { acceptConnectionRequest, declineConnectionRequest } from "@/app/actions/messaging";
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

type ChatRequest = {
  id: string;
  status: string;
  createdAt: Date;
  startupName: string | null;
  founder: {
    name: string;
    email: string;
  };
  investor: {
    name: string;
    email: string;
  };
};

type ChatRequestsTableProps = {
  requests: ChatRequest[];
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getStatusClassName(status: string) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
    case "CLOSED":
      return "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300";
    default:
      return "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300";
  }
}

export function ChatRequestsTable({ requests }: ChatRequestsTableProps) {
  const [pendingRequestId, setPendingRequestId] = React.useState<string | null>(null);

  function handleRequest(
    action: "accept" | "decline",
    conversationId: string,
  ) {
    setPendingRequestId(conversationId);

    const actionFn =
      action === "accept" ? acceptConnectionRequest : declineConnectionRequest;

    actionFn(conversationId)
      .then(() => {
        toast({
          title: action === "accept" ? "Connection accepted" : "Connection declined",
          description:
            action === "accept"
              ? "The request is now active and the investor can send messages."
              : "The request has been closed.",
        });
      })
      .catch((error) => {
        toast({
          title: "Action failed",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setPendingRequestId(null);
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
            <TableHead>Requested</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length > 0 ? (
            requests.map((request) => {
              const isBusy = pendingRequestId === request.id;
              const startupName = request.startupName ?? "Unknown startup";

              return (
                <TableRow key={request.id}>
                  <TableCell className="font-medium text-zinc-950 dark:text-zinc-50">
                    <div className="space-y-1">
                      <p>{startupName}</p>
                      <p className="text-xs text-zinc-500">Investor chat request</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p>{request.founder.name}</p>
                      <p className="text-xs text-zinc-500">{request.founder.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p>{request.investor.name}</p>
                      <p className="text-xs text-zinc-500">{request.investor.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(request.createdAt)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusClassName(request.status)}>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        className="bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
                        disabled={isBusy || request.status !== "PENDING"}
                        onClick={() => handleRequest("accept", request.id)}
                      >
                        {isBusy ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        Accept
                      </Button>
                      <Button
                        type="button"
                        className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
                        disabled={isBusy || request.status !== "PENDING"}
                        onClick={() => handleRequest("decline", request.id)}
                      >
                        {isBusy ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <MessageSquareOff className="mr-2 h-4 w-4" />
                        )}
                        Decline
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-zinc-500">
                No investor chat requests right now.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
