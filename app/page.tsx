import { AuthForm } from "@/components/auth/auth-form";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-5xl space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-neutral-500">
            nexafoundr
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-white sm:text-4xl">
            Join the founder and investor network
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-neutral-600 dark:text-neutral-400 sm:text-base">
            Sign up to create an account or log in to continue with your
            current session.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <AuthForm type="login" />
          <AuthForm type="signup" />
        </div>
      </div>
    </main>
  );
}
