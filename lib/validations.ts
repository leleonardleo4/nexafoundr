import { z } from "zod";

export const startupIndustries = [
  "Fintech",
  "Healthtech",
  "Edtech",
  "SaaS",
  "E-commerce",
  "Logistics",
  "AgriTech",
  "Energy",
  "AI / ML",
  "Consumer",
  "Media",
  "Other",
] as const;

export const startupStages = [
  "Idea",
  "Pre-seed",
  "Seed",
  "Series A",
  "Series B",
  "Growth",
  "Profitability",
] as const;

export const startupSchema = z.object({
  name: z.string().trim().min(1, "Startup name is required."),
  description: z.string().trim().min(1, "Startup description is required."),
  industry: z.enum(startupIndustries, {
    error: "Select a valid industry.",
  }),
  stage: z.enum(startupStages, {
    error: "Select a valid stage.",
  }),
  fundingRequired: z.coerce
    .number()
    .positive("Funding required must be a positive number."),
  equityOffered: z.coerce
    .number()
    .gt(0, "Equity offered must be greater than 0.")
    .lte(100, "Equity offered cannot exceed 100."),
});

export const startupVerificationSchema = startupSchema.extend({
  teamInformation: z
    .string()
    .trim()
    .min(1, "Team information is required.")
    .transform((value) => {
      try {
        return JSON.parse(value) as unknown;
      } catch {
        return value;
      }
    }),
  websiteUrl: z
    .string()
    .trim()
    .url("Website URL must be a valid URL.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const investmentSchema = z.object({
  amount: z.coerce
    .number()
    .positive("Investment amount must be a positive number."),
});

export const verificationStatusSchema = z.enum(["VERIFIED", "REJECTED"]);
