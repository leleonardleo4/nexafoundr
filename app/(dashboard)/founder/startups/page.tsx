import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getDashboardPath, isDashboardRole } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

async function getFounderUser() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user || !isDashboardRole(user.role)) {
    redirect("/");
  }

  if (user.role !== "FOUNDER") {
    redirect(getDashboardPath(user.role));
  }

  return user;
}

export default async function FounderStartupsPage() {
  const user = await getFounderUser();

  const startups = await prisma.startup.findMany({
    where: {
      founderId: user.id,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
            Founder startups
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
            Your startup listings
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Review every startup you have submitted and track verification
            progress before investors can discover it.
          </p>
        </div>

        <Button asChild>
          <Link href="/founder">Create listing</Link>
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {startups.length > 0 ? (
          startups.map((startup) => (
            <Card key={startup.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{startup.name}</CardTitle>
                    <CardDescription>
                      {startup.industry} | {startup.stage}
                    </CardDescription>
                  </div>
                  <Badge>{startup.verificationStatus}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
                  {startup.description}
                </p>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-zinc-500">Funding goal</p>
                    <p className="font-medium text-zinc-950 dark:text-zinc-50">
                      NGN {startup.fundingRequired.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Equity offered</p>
                    <p className="font-medium text-zinc-950 dark:text-zinc-50">
                      {startup.equityOffered}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardHeader>
              <CardTitle>No startup listings yet</CardTitle>
              <CardDescription>
                Create your first listing from the Founder dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/founder">Go to Founder dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
