import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";

import { VerificationReviewActions } from "@/components/admin/verification-review-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getDashboardPath, isDashboardRole } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

type AdminVerificationReviewPageProps = {
  params: Promise<{
    startupId: string;
  }>;
};

async function getAdminUser() {
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
      role: true,
    },
  });

  if (!user || !isDashboardRole(user.role)) {
    redirect("/");
  }

  if (user.role !== "ADMIN") {
    redirect(getDashboardPath(user.role));
  }
}

export default async function AdminVerificationReviewPage({
  params,
}: AdminVerificationReviewPageProps) {
  await getAdminUser();
  const { startupId } = await params;

  const startup = await prisma.startup.findUnique({
    where: {
      id: startupId,
    },
    include: {
      documents: true,
      founder: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!startup) {
    notFound();
  }

  const teamInformation =
    startup.teamInformation && typeof startup.teamInformation === "object"
      ? startup.teamInformation
      : null;
  const teamSummary =
    teamInformation &&
    "summary" in teamInformation &&
    typeof teamInformation.summary === "string"
      ? teamInformation.summary
      : typeof startup.teamInformation === "string"
        ? startup.teamInformation
        : "No team information provided.";
  const socialLinks =
    teamInformation &&
    "socialLinks" in teamInformation &&
    Array.isArray(teamInformation.socialLinks)
      ? teamInformation.socialLinks.filter((link): link is string => typeof link === "string")
      : [];

  return (
    <div className="space-y-8">
      <div>
        <Button
          asChild
          className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
        >
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to admin
          </Link>
        </Button>
      </div>

      <section className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
              Verification review
            </p>
            <Badge>{startup.verificationStatus}</Badge>
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
            {startup.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Review the company profile, team information, pitch deck, and CAC
            document before making an approval decision.
          </p>
        </div>

        <VerificationReviewActions
          startupId={startup.id}
          disabled={startup.verificationStatus !== "PENDING"}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Founder</CardDescription>
            <CardTitle>{startup.founder.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-500">{startup.founder.email}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Funding goal</CardDescription>
            <CardTitle>NGN {startup.fundingRequired.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-500">{startup.equityOffered}% equity offered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Market</CardDescription>
            <CardTitle>{startup.industry}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-500">{startup.stage}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Startup profile</CardTitle>
            <CardDescription>Business summary and team context.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h2 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                Description
              </h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {startup.description}
              </p>
            </div>

            <div>
              <h2 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                Team information
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
                {teamSummary}
              </p>
            </div>

            {startup.websiteUrl ? (
              <DocumentLink label="Website" href={startup.websiteUrl} />
            ) : null}

            {socialLinks.length > 0 ? (
              <div className="space-y-2">
                <h2 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  Social links
                </h2>
                <div className="grid gap-2">
                  {socialLinks.map((link) => (
                    <DocumentLink key={link} label={link} href={link} />
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verification documents</CardTitle>
            <CardDescription>Pitch and legal documents submitted by the founder.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DocumentReviewItem
              title="Pitch deck"
              href={startup.documents?.pitchDeckUrl}
            />
            <DocumentReviewItem
              title="CAC registration"
              href={startup.documents?.cacRegistrationUrl}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function DocumentReviewItem({
  title,
  href,
}: {
  title: string;
  href?: string | null;
}) {
  return (
    <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-zinc-500" />
          <div className="min-w-0">
            <h2 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
              {title}
            </h2>
            <p className="mt-1 truncate text-xs text-zinc-500">
              {href ?? "No document uploaded"}
            </p>
          </div>
        </div>
        {href ? (
          <Button asChild className="shrink-0">
            <a href={href} target="_blank" rel="noreferrer">
              Open
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function DocumentLink({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex w-fit items-center gap-2 text-sm font-medium text-zinc-950 underline-offset-4 hover:underline dark:text-zinc-50"
    >
      {label}
      <ExternalLink className="h-4 w-4" />
    </a>
  );
}
