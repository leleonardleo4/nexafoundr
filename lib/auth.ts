import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        input: true,
        returned: true,
        validator: {
          input: z.enum(["FOUNDER", "INVESTOR"]),
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: {
    allowedHosts: [
      "localhost:3000",
      "127.0.0.1:3000",
      "*.ngrok-free.dev",
      "*.ngrok-free.app",
      "demandarryl.site",
      "*.demandarryl.site",
    ],
    fallback:
      process.env.BETTER_AUTH_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000",
  },
});

export default auth;
