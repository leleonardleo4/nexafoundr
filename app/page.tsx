import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Wallet } from "lucide-react";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[color:var(--background)] px-4 py-6 text-[color:var(--foreground)] sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_26%),radial-gradient(circle_at_top_right,rgba(37,99,235,0.16),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(124,58,237,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-[color:var(--border)] to-transparent" />
      <div className="absolute right-[-8rem] top-1/3 -z-10 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.18),transparent_70%)] blur-3xl" />
      <div className="absolute left-[-7rem] bottom-[-6rem] -z-10 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.14),transparent_70%)] blur-3xl" />

      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative overflow-hidden rounded-[2.25rem] border border-[color:var(--border)] bg-[linear-gradient(160deg,rgba(9,15,31,0.96),rgba(15,23,42,0.9))] p-8 shadow-[0_40px_120px_rgba(15,23,42,0.42)] backdrop-blur-sm sm:p-10 lg:p-12">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(20,184,166,0.1),transparent_34%,rgba(124,58,237,0.1)_72%,transparent)]" />
            <div className="absolute -right-16 top-10 h-56 w-56 rounded-full border border-white/10 bg-[radial-gradient(circle,rgba(20,184,166,0.24),transparent_72%)] blur-2xl" />
            <div className="absolute bottom-0 left-0 h-44 w-44 rounded-full border border-white/10 bg-[radial-gradient(circle,rgba(37,99,235,0.16),transparent_72%)] blur-2xl" />

            <div className="relative flex h-full min-h-[34rem] flex-col justify-between gap-10">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.38em] text-white/70">
                  <Sparkles className="h-3.5 w-3.5" />
                  NexaFoundr
                </div>

                <div className="space-y-4">
                  <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white text-balance sm:text-5xl lg:text-6xl">
                    A cleaner path from first sign-in to funded startup.
                  </h1>
                  <p className="max-w-xl text-sm leading-7 text-white/72 sm:text-base">
                    Privy handles the identity layer, Phantom handles the wallet path, and the
                    dashboard stays focused on building instead of wrestling auth.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {["Phantom wallet", "X auth", "Founder dashboards"].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    icon: Wallet,
                    title: "Fast entry",
                    detail: "Phantom and X keep the front door simple.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Private by default",
                    detail: "Sessions stay tied to Privy instead of custom cookie hacks.",
                  },
                  {
                    icon: ArrowRight,
                    title: "Straight through",
                    detail: "New users land in the right dashboard immediately after auth.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-3xl border border-white/10 bg-white/5 p-4 text-white/80 shadow-[0_20px_60px_rgba(2,6,23,0.18)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-xs leading-5 text-white/66">{item.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="relative rounded-[2.25rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_30px_90px_rgba(15,23,42,0.16)] backdrop-blur-2xl sm:p-6 lg:p-8">
            <div className="rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--muted-foreground)]">
                Start here
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">
                One sign-in. One dashboard.
              </h2>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted-foreground)]">
                The new flow is intentionally small: hit login, choose Phantom or X, and move
                on. No extra setup screens, no weird detours.
              </p>

              <div className="mt-6 grid gap-3">
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] px-5 text-sm font-semibold text-[color:var(--primary-foreground)] transition-colors hover:bg-[color:var(--primary-hover)]"
                >
                  Open login
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-5 text-sm font-semibold text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--surface-strong)]"
                >
                  New here? Start the same clean flow
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
