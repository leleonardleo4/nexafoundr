import { acceptConnectionRequest, declineConnectionRequest } from "@/app/actions/messaging";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ConnectionRequest = {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  investor: {
    name: string;
    email: string;
  };
};

type ConnectionRequestsSectionProps = {
  requests: ConnectionRequest[];
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function ConnectionRequestsSection({
  requests,
}: ConnectionRequestsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Peer-to-peer messaging</CardDescription>
        <CardTitle>Connection requests</CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex flex-col gap-4 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                      {request.investor.name}
                    </h3>
                    <Badge>{request.status}</Badge>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {request.investor.email}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Requested {formatDate(request.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <form action={acceptConnectionRequest.bind(null, request.id)}>
                    <Button type="submit">Accept</Button>
                  </form>
                  <form action={declineConnectionRequest.bind(null, request.id)}>
                    <Button
                      type="submit"
                      className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
                    >
                      Decline
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-500">
              No pending connection requests right now.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
