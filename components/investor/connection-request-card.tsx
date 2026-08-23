import { requestConnection } from "@/app/actions/messaging";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

type ConnectionRequestCardProps = {
  startupId: string;
  startupName: string;
  conversationId: string | null;
  conversationStatus: string | null;
};

function getStatusTone(status: string | null) {
  switch (status) {
    case "ACTIVE":
      return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300";
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
    case "CLOSED":
      return "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300";
    default:
      return "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300";
  }
}

export function ConnectionRequestCard({
  startupId,
  startupName,
  conversationId,
  conversationStatus,
}: ConnectionRequestCardProps) {
  const canRequest = conversationStatus !== "ACTIVE";

  return (
    <Card>
      <CardHeader>
        <CardDescription>Peer connection</CardDescription>
        <CardTitle>Connect with the founder</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Send a connection request to {startupName}&apos;s founder before starting a
          private conversation.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Badge className={getStatusTone(conversationStatus)}>
            {conversationStatus ?? "NO REQUEST"}
          </Badge>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {conversationStatus === "ACTIVE"
              ? "The connection is live."
              : conversationStatus === "PENDING"
                ? "Waiting for the founder to accept."
                : "No request has been sent yet."}
          </span>
        </div>

        {conversationStatus === "ACTIVE" && conversationId ? (
          <Button asChild className="w-full">
            <Link href={`/messages/${conversationId}`}>Open chat room</Link>
          </Button>
        ) : canRequest ? (
          <form action={requestConnection.bind(null, startupId)}>
            <Button type="submit" className="w-full">
              Connect
            </Button>
          </form>
        ) : (
          <Button type="button" disabled className="w-full">
            Connected
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
