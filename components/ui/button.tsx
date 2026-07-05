"use client";

import * as React from "react";

type ButtonOwnProps = {
  asChild?: boolean;
  children?: React.ReactNode;
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonOwnProps;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", disabled, type = "button", asChild, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
        className: [
          "inline-flex h-10 items-center justify-center rounded-md bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-black/90 disabled:pointer-events-none disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90",
          className,
          (children.props as { className?: string }).className ?? "",
        ]
          .join(" ")
          .trim(),
      });
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={[
          "inline-flex h-10 items-center justify-center rounded-md bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-black/90 disabled:pointer-events-none disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90",
          className,
        ].join(" ")}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
