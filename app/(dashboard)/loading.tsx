export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
        <div className="h-4 w-32 animate-pulse rounded bg-[color:var(--surface-strong)]" />
        <div className="mt-4 h-8 w-2/3 animate-pulse rounded bg-[color:var(--surface-strong)]" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-[color:var(--surface-strong)]" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)]"
          />
        ))}
      </div>
    </div>
  );
}
