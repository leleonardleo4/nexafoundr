import * as React from "react";

export function Badge({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full bg-[color:var(--surface-strong)] px-3 py-1 text-xs font-medium text-[color:var(--foreground)] ring-1 ring-[color:var(--border)]",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
