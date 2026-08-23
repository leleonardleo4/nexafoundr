import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  // Use the current browser origin so localhost, tunnels, and production all
  // resolve the same auth cookies without hardcoding a single host.
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: "string",
          required: true,
          input: true,
          returned: true,
        },
      },
    }),
  ],
});

export default authClient;
