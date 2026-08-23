"use client";

import * as React from "react";
import Link from "next/link";
import { BookmarkCheck, BookmarkMinus, Search } from "lucide-react";

import { searchVerifiedStartups, toggleSavedStartup } from "@/app/actions/startup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { startupIndustries, startupStages } from "@/lib/validations";

type StartupMarketplaceItem = {
  id: string;
  name: string;
  description: string;
  industry: string;
  stage: string;
  fundingRequired: number;
  equityOffered: number;
};

type StartupMarketplaceProps = {
  startups: StartupMarketplaceItem[];
  savedStartupIds: string[];
};

export function StartupMarketplace({
  startups,
  savedStartupIds,
}: StartupMarketplaceProps) {
  const [name, setName] = React.useState("");
  const [industry, setIndustry] = React.useState("");
  const [stage, setStage] = React.useState("");
  const [results, setResults] = React.useState(startups);
  const [savedIds, setSavedIds] = React.useState(() => new Set(savedStartupIds));
  const [pendingStartupId, setPendingStartupId] = React.useState<string | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      if (!active) {
        return;
      }

      setIsSearching(true);

      searchVerifiedStartups({
        name,
        industry,
        stage,
      })
        .then((startups) => {
          if (!active) {
            return;
          }

          setResults(startups);
        })
        .catch((error) => {
          if (!active) {
            return;
          }

          toast({
            title: "Search failed",
            description: error instanceof Error ? error.message : "Please try again.",
            variant: "destructive",
          });
        })
        .finally(() => {
          if (!active) {
            return;
          }

          setIsSearching(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [name, industry, stage]);

  function handleSaveToggle(startupId: string) {
    setPendingStartupId(startupId);

    startTransition(() => {
      toggleSavedStartup(startupId)
        .then((result) => {
          setSavedIds((currentSavedIds) => {
            const nextSavedIds = new Set(currentSavedIds);

            if (result.saved) {
              nextSavedIds.add(startupId);
            } else {
              nextSavedIds.delete(startupId);
            }

            return nextSavedIds;
          });

          toast({
            title: result.saved ? "Startup saved" : "Startup removed",
            description: result.saved
              ? "This startup has been added to your saved list."
              : "This startup has been removed from your saved list.",
          });
        })
        .catch((error) => {
          toast({
            title: "Save failed",
            description: error instanceof Error ? error.message : "Please try again.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setPendingStartupId(null);
        });
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-sm backdrop-blur md:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Search by startup name"
            className="pl-9"
          />
        </div>
        <label className="sr-only" htmlFor="marketplace-industry">
          Filter by industry
        </label>
        <select
          id="marketplace-industry"
          value={industry}
          onChange={(event) => setIndustry(event.target.value)}
          className="h-11 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-sm outline-none transition focus:border-[color:var(--primary)]"
        >
          <option value="">All industries</option>
          {startupIndustries.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="marketplace-stage">
          Filter by stage
        </label>
        <select
          id="marketplace-stage"
          value={stage}
          onChange={(event) => setStage(event.target.value)}
          className="h-11 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-sm outline-none transition focus:border-[color:var(--primary)]"
        >
          <option value="">All stages</option>
          {startupStages.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {isSearching ? (
        <p className="text-sm text-[color:var(--muted-foreground)]">Searching verified startups...</p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {results.length > 0 ? (
          results.map((startup) => {
            const saved = savedIds.has(startup.id);
            const savePending = pendingStartupId === startup.id && isPending;

            return (
              <Card key={startup.id} className="flex h-full flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle>{startup.name}</CardTitle>
                    <button
                      type="button"
                      disabled={savePending}
                      onClick={() => handleSaveToggle(startup.id)}
                    className={[
                        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                        saved
                          ? "border-[color:var(--primary)] bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                          : "border-[color:var(--border)] text-[color:var(--foreground)] hover:border-[color:var(--primary)]",
                      ].join(" ")}
                      aria-label={saved ? "Remove saved startup" : "Save startup"}
                    >
                      {saved ? (
                        <BookmarkMinus className="h-4 w-4" />
                      ) : (
                        <BookmarkCheck className="h-4 w-4" />
                      )}
                      <span>{saved ? "Saved" : "Save"}</span>
                    </button>
                  </div>
                  <CardDescription
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {startup.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{startup.industry}</Badge>
                    <Badge>{startup.stage}</Badge>
                  </div>
                  <p className="text-sm text-[color:var(--muted-foreground)]">
                    Funding goal: USD {startup.fundingRequired.toLocaleString()}
                  </p>
                  <p className="text-sm text-[color:var(--muted-foreground)]">
                    Equity offered: {startup.equityOffered}%
                  </p>
                </CardContent>

                <CardFooter className="mt-auto">
                  <Button asChild className="w-full">
                    <Link href={`/investor/startups/${startup.id}`}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-[color:var(--border)] p-8 text-sm text-[color:var(--muted-foreground)]">
            No startups match your search.
          </div>
        )}
      </div>
    </div>
  );
}
