import * as React from "react";

export function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={[
        "flex h-11 w-full rounded-md border border-zinc-300 bg-transparent px-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 dark:border-zinc-700 dark:placeholder:text-zinc-500 dark:focus:border-zinc-50",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
