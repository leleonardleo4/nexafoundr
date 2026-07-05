"use client";

import * as React from "react";
import { Check, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { approveStartup, rejectStartup } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

type VerificationReviewActionsProps = {
  startupId: string;
  disabled?: boolean;
};

export function VerificationReviewActions({
  startupId,
  disabled = false,
}: VerificationReviewActionsProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = React.useState<"approve" | "reject" | null>(null);

  function handleAction(action: "approve" | "reject") {
    setPendingAction(action);

    const actionPromise =
      action === "approve" ? approveStartup(startupId) : rejectStartup(startupId);

    actionPromise
      .then(() => {
        toast({
          title: action === "approve" ? "Startup approved" : "Startup rejected",
          description: "The founder has been notified about this decision.",
        });
        router.push("/admin");
        router.refresh();
      })
      .catch((error) => {
        toast({
          title: "Review failed",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setPendingAction(null);
      });
  }

  const isPending = pendingAction !== null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button
        type="button"
        disabled={disabled || isPending}
        onClick={() => handleAction("reject")}
        className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
      >
        {pendingAction === "reject" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <X className="mr-2 h-4 w-4" />
        )}
        {pendingAction === "reject" ? "Rejecting..." : "Reject"}
      </Button>
      <Button
        type="button"
        disabled={disabled || isPending}
        onClick={() => handleAction("approve")}
      >
        {pendingAction === "approve" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Check className="mr-2 h-4 w-4" />
        )}
        {pendingAction === "approve" ? "Approving..." : "Approve"}
      </Button>
    </div>
  );
}
