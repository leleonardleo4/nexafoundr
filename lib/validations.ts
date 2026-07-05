import { z } from "zod";

export const startupSchema = z.object({
  name: z.string().trim().min(1, "Startup name is required."),
  description: z.string().trim().min(1, "Startup description is required."),
  industry: z.string().trim().min(1, "Industry is required."),
  stage: z.string().trim().min(1, "Stage is required."),
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
