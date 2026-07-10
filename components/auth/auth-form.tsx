"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

type AuthFormType = "login" | "signup";

type AuthFormProps = {
  type: AuthFormType;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }

  return "Something went wrong. Please try again.";
}

export function AuthForm({ type }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<"FOUNDER" | "INVESTOR">("FOUNDER");
  const [isLoading, setIsLoading] = React.useState(false);

  const isSignup = type === "signup";

  function getDashboardPath(userRole?: string | null) {
    if (userRole === "ADMIN") {
      return "/admin";
    }

    if (userRole === "INVESTOR") {
      return "/investor";
    }

    return "/founder";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = isSignup
        ? await authClient.signUp.email({
            name,
            email,
            password,
            role,
          })
        : await authClient.signIn.email({
            email,
            password,
          });

      if (response.error) {
        throw response.error;
      }

      const currentSession = await authClient.getSession();
      const userRole =
        response.data?.user?.role ??
        currentSession.data?.user?.role ??
        role;

      toast({
        title: isSignup ? "Account created" : "Welcome back",
        description: isSignup
          ? "Your signup was successful."
          : "You have been signed in successfully.",
      });

      router.replace(getDashboardPath(userRole));
      router.refresh();
    } catch (error) {
      toast({
        title: "Authentication failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="flex w-full max-w-md flex-col gap-4 rounded-xl border p-6 shadow-sm" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold">
          {isSignup ? "Create your account" : "Welcome back"}
        </h2>
        <p className="text-sm text-neutral-500">
          {isSignup
            ? "Sign up to get started with nexafoundr."
            : "Sign in to continue where you left off."}
        </p>
      </div>

      {isSignup ? (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-10 w-full rounded-md border border-neutral-300 bg-transparent px-3 text-sm outline-none transition focus:border-black dark:border-neutral-700 dark:focus:border-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="role">
              Account type
            </label>
            <select
              id="role"
              name="role"
              required
              value={role}
              onChange={(event) => setRole(event.target.value as "FOUNDER" | "INVESTOR")}
              className="h-10 w-full rounded-md border border-neutral-300 bg-transparent px-3 text-sm outline-none transition focus:border-black dark:border-neutral-700 dark:focus:border-white"
            >
              <option value="FOUNDER">Founder</option>
              <option value="INVESTOR">Investor</option>
            </select>
          </div>
        </>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-10 w-full rounded-md border border-neutral-300 bg-transparent px-3 text-sm outline-none transition focus:border-black dark:border-neutral-700 dark:focus:border-white"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-10 w-full rounded-md border border-neutral-300 bg-transparent px-3 text-sm outline-none transition focus:border-black dark:border-neutral-700 dark:focus:border-white"
        />
      </div>

      <Button type="submit" disabled={isLoading} className="mt-2 w-full">
        {isLoading
          ? isSignup
            ? "Creating account..."
            : "Signing in..."
          : isSignup
            ? "Sign up"
            : "Sign in"}
      </Button>
    </form>
  );
}

export default AuthForm;
