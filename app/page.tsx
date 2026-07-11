import { ArrowRight, BadgeCheck, LineChart, MessagesSquare, ShieldCheck, Sparkles } from "lucide-react";

import { AuthForm } from "@/components/auth/auth-form";
import { Button } from "@/components/ui/button";

const highlights = [
  {
    title: "Escrow-first funding",
    description: "Investors fund verified startups through a clean, traceable Solana flow.",
    icon: ShieldCheck,
  },
  {
    title: "Founder and investor chat",
    description: "Private connection requests keep conversations intentional and context-rich.",
    icon: MessagesSquare,
  },
  {
    title: "Signals that matter",
    description: "A dashboard that surfaces funding progress, trust, and momentum at a glance.",
    icon: LineChart,
  },
];

const stats = [
  { value: "Verified", label: "startup onboarding" },
  { value: "Escrow", label: "funding flow" },
  { value: "Private", label: "p2p conversations" },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f1ea] px-4 py-6 text-zinc-950 dark:bg-[#050816] dark:text-zinc-50 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.14),transparent_32%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_28%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.65),transparent_40%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-black/15 to-transparent dark:via-white/15" />

      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col justify-center gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/60 bg-white/70 px-4 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.38em] text-slate-500 dark:text-slate-400">
              NexaFoundr
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Built for founder trust, investor clarity, and escrow-backed momentum.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <BadgeCheck className="h-4 w-4" />
            Verified startup pipeline
          </div>
        </header>

        <section className="grid items-stretch gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Premium founder-investor infrastructure
              </div>

              <div className="space-y-4">
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
                  Capital, conversations, and escrow in one clean motion.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
                  NexaFoundr gives verified startups a refined public presence, investors a clear path
                  to connect, and both sides a more trustworthy way to move from interest to funding.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <a href="#auth" className="inline-flex items-center gap-2">
                    Access the platform
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  className="border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  <a href="#highlights">See what is included</a>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
                >
                  <p className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            id="auth"
            className="rounded-[2rem] border border-white/70 bg-white/75 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.16)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 sm:p-6"
          >
            <div className="mb-6 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Member access
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Sign in or create an account
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Use your existing session, or join as a founder or investor and continue into the
                right dashboard automatically.
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <AuthForm type="login" />
              <AuthForm type="signup" />
            </div>
          </div>
        </section>

        <section id="highlights" className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-[1.75rem] border border-white/70 bg-white/75 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {item.description}
                </p>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
