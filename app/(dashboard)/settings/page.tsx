import { WalletTestPanel } from "@/components/solana/wallet-test-panel";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
        <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
          Settings
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
          Account settings
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Manage profile details, preferences, and account security from one
          place.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {[
          {
            title: "Profile",
            description: "Update your display name, avatar, and bio.",
          },
          {
            title: "Security",
            description: "Review passwords, sessions, and access controls.",
          },
        ].map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60"
          >
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              {item.title}
            </h2>
            <p className="mt-2 text-sm text-zinc-500">{item.description}</p>
          </article>
        ))}
      </section>

      <WalletTestPanel />
    </div>
  );
}
