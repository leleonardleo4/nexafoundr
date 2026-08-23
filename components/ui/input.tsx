import * as React from "react";

export function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={[
        "flex h-11 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-sm outline-none transition placeholder:text-[color:var(--muted-foreground)] focus:border-[color:var(--primary)]",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
