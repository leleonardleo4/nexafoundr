"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";

import { submitStartupForVerification } from "@/app/actions/startup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Steps } from "@/components/ui/steps";
import { toast } from "@/components/ui/use-toast";
import { startupIndustries, startupStages } from "@/lib/validations";

const SOCIAL_PLATFORMS = [
  "X (Twitter)",
  "Telegram",
  "LinkedIn",
  "Instagram",
  "WhatsApp",
  "Discord",
  "YouTube",
] as const;

const DOC_ACCEPT =
  ".pdf,.doc,.docx,.rtf,.odt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/rtf,application/vnd.oasis.opendocument.text";

const steps = [
  {
    title: "Basic Info",
    description: "Name, market, website, and deal terms.",
  },
  {
    title: "Team & Pitch",
    description: "Team details, social links, and pitch deck.",
  },
  {
    title: "Legal Verification",
    description: "CAC registration document.",
  },
] as const;

type SocialLinkEntry = {
  platform: (typeof SOCIAL_PLATFORMS)[number];
  url: string;
};

type FormState = {
  name: string;
  industry: (typeof startupIndustries)[number] | "";
  websiteUrl: string;
  stage: (typeof startupStages)[number] | "";
  fundingRequired: string;
  equityOffered: string;
  description: string;
  teamInformation: string;
  socialLinks: SocialLinkEntry[];
  pitchDeck: File | null;
  cacRegistration: File | null;
};

const initialFormState: FormState = {
  name: "",
  industry: "",
  websiteUrl: "",
  stage: "",
  fundingRequired: "",
  equityOffered: "",
  description: "",
  teamInformation: "",
  socialLinks: SOCIAL_PLATFORMS.map((platform) => ({ platform, url: "" })),
  pitchDeck: null,
  cacRegistration: null,
};

export function StartupVerificationForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [formState, setFormState] = React.useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateSocialLink(index: number, url: string) {
    setFormState((current) => ({
      ...current,
      socialLinks: current.socialLinks.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, url } : entry,
      ),
    }));
  }

  function nextStep() {
    setCurrentStep((step) => Math.min(step + 1, steps.length));
  }

  function previousStep() {
    setCurrentStep((step) => Math.max(step - 1, 1));
  }

  function buildFormData() {
    const formData = new FormData();
    const teamInformation = {
      summary: formState.teamInformation,
      socialLinks: formState.socialLinks
        .map((entry) => ({
          platform: entry.platform,
          url: entry.url.trim(),
        }))
        .filter((entry) => entry.url),
    };

    formData.set("name", formState.name);
    formData.set("industry", formState.industry);
    formData.set("websiteUrl", formState.websiteUrl);
    formData.set("stage", formState.stage);
    formData.set("fundingRequired", formState.fundingRequired);
    formData.set("equityOffered", formState.equityOffered);
    formData.set("description", formState.description);
    formData.set("teamInformation", JSON.stringify(teamInformation));

    if (formState.pitchDeck) {
      formData.set("pitchDeck", formState.pitchDeck);
    }

    if (formState.cacRegistration) {
      formData.set("cacRegistration", formState.cacRegistration);
    }

    return formData;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    startTransition(() => {
      submitStartupForVerification(buildFormData())
        .then(() => {
          toast({
            title: "Verification submitted",
            description: "Your startup is now pending admin review.",
          });
          setFormState(initialFormState);
          setCurrentStep(1);
          router.refresh();
        })
        .catch((error) => {
          toast({
            title: "Submission failed",
            description: error instanceof Error ? error.message : "Please try again.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    });
  }

  const pending = isSubmitting || isPending;

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <Steps steps={steps} currentStep={currentStep} />

      {currentStep === 1 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Startup name" htmlFor="verification-name">
            <Input
              id="verification-name"
              required
              value={formState.name}
              onChange={(event) => updateField("name", event.target.value)}
            />
          </Field>

          <Field label="Industry" htmlFor="verification-industry">
            <select
              id="verification-industry"
              required
              value={formState.industry}
              onChange={(event) =>
                updateField("industry", event.target.value as FormState["industry"])
              }
              className="h-11 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--primary)]"
            >
              <option value="" disabled className="bg-[color:var(--surface-strong)] text-[color:var(--muted-foreground)]">
                Select an industry
              </option>
              {startupIndustries.map((industry) => (
                <option key={industry} value={industry} className="bg-[color:var(--surface-strong)] text-[color:var(--foreground)]">
                  {industry}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Website" htmlFor="verification-website">
            <Input
              id="verification-website"
              type="url"
              placeholder="https://example.com"
              required
              value={formState.websiteUrl}
              onChange={(event) => updateField("websiteUrl", event.target.value)}
            />
          </Field>

          <Field label="Stage" htmlFor="verification-stage">
            <select
              id="verification-stage"
              required
              value={formState.stage}
              onChange={(event) =>
                updateField("stage", event.target.value as FormState["stage"])
              }
              className="h-11 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--primary)]"
            >
              <option value="" disabled className="bg-[color:var(--surface-strong)] text-[color:var(--muted-foreground)]">
                Select a stage
              </option>
              {startupStages.map((stage) => (
                <option key={stage} value={stage} className="bg-[color:var(--surface-strong)] text-[color:var(--foreground)]">
                  {stage}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Funding required (USD)" htmlFor="verification-funding">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-zinc-500 dark:text-zinc-400">
                $
              </span>
              <Input
                id="verification-funding"
                type="number"
                min="1"
                step="0.01"
                required
                value={formState.fundingRequired}
                onChange={(event) => updateField("fundingRequired", event.target.value)}
                className="pl-7"
              />
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Default currency is USD.
            </p>
          </Field>

          <Field label="Equity offered (%)" htmlFor="verification-equity">
            <Input
              id="verification-equity"
              type="number"
              min="0.1"
              max="100"
              step="0.1"
              required
              value={formState.equityOffered}
              onChange={(event) => updateField("equityOffered", event.target.value)}
            />
          </Field>

          <Field
            label="Startup description"
            htmlFor="verification-description"
            className="md:col-span-2"
          >
            <Textarea
              id="verification-description"
              required
              rows={4}
              value={formState.description}
              onChange={(event) => updateField("description", event.target.value)}
            />
          </Field>
        </div>
      ) : null}

      {currentStep === 2 ? (
        <div className="grid gap-4">
          <Field label="Team information" htmlFor="verification-team">
            <Textarea
              id="verification-team"
              required
              rows={5}
              placeholder="Founder names, roles, experience, and key team members"
              value={formState.teamInformation}
              onChange={(event) => updateField("teamInformation", event.target.value)}
            />
          </Field>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                Social links
              </label>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Add the social channels your team actively uses. Leave unused rows blank.
              </p>
            </div>

            <div className="grid gap-3">
              {formState.socialLinks.map((entry, index) => (
                <div
                  key={entry.platform}
                  className="grid gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center"
                >
                  <div className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {entry.platform}
                  </div>
                  <Input
                    value={entry.url}
                    onChange={(event) => updateSocialLink(index, event.target.value)}
                    placeholder={`https://${entry.platform.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com/yourpage`}
                  />
                </div>
              ))}
            </div>
          </div>

          <Field label="Pitch deck upload" htmlFor="verification-pitch-deck">
            <Input
              id="verification-pitch-deck"
              type="file"
              accept=".pdf,.ppt,.pptx,.key"
              required
              onChange={(event) =>
                updateField("pitchDeck", event.target.files?.[0] ?? null)
              }
            />
          </Field>
        </div>
      ) : null}

      {currentStep === 3 ? (
        <div className="grid gap-4">
          <Field label="CAC registration upload" htmlFor="verification-cac">
            <Input
              id="verification-cac"
              type="file"
              accept={DOC_ACCEPT}
              required
              onChange={(event) =>
                updateField("cacRegistration", event.target.files?.[0] ?? null)
              }
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Accepted formats: PDF, Word documents, RTF, and ODT files.
            </p>
          </Field>

          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            Submitting sends your startup to admin review with a pending
            verification status.
          </div>
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
        <Button
          type="button"
          disabled={currentStep === 1 || pending}
          onClick={previousStep}
          className="border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {currentStep < steps.length ? (
          <Button type="button" onClick={nextStep}>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={pending}>
            {pending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {pending ? "Submitting..." : "Submit for verification"}
          </Button>
        )}
      </div>
    </form>
  );
}

type FieldProps = {
  label: string;
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
};

function Field({ label, htmlFor, className = "", children }: FieldProps) {
  return (
    <div className={["space-y-2", className].join(" ")}>
      <label
        className="text-sm font-medium text-zinc-950 dark:text-zinc-50"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={[
        "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 dark:border-zinc-700 dark:placeholder:text-zinc-500 dark:focus:border-zinc-50",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
