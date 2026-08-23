"use client";

import * as React from "react";

type ButtonOwnProps = {
  asChild?: boolean;
  children?: React.ReactNode;
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonOwnProps;

function hasRenderableText(node: React.ReactNode): boolean {
  if (node === null || node === undefined || typeof node === "boolean") {
    return false;
  }

  if (typeof node === "string" || typeof node === "number") {
    return String(node).trim().length > 0;
  }

  if (Array.isArray(node)) {
    return node.some(hasRenderableText);
  }

  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<{ children?: React.ReactNode }>;
    return hasRenderableText(element.props.children);
  }

  return false;
}

function hasAccessibleLabel(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>,
  children: React.ReactNode,
): boolean {
  return Boolean(
    props["aria-label"] ||
      props["aria-labelledby"] ||
      props.title ||
      hasRenderableText(children),
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", disabled, type = "button", asChild, children, ...props }, ref) => {
    const labelProps = (
      asChild && React.isValidElement(children) ? children.props : props
    ) as React.ButtonHTMLAttributes<HTMLButtonElement>;
    const isLabeled = hasAccessibleLabel(labelProps, children);

    React.useEffect(() => {
      if (process.env.NODE_ENV === "production" || isLabeled) {
        return;
      }

      console.warn(
        "Button rendered without a visible label or aria-label. Add text, title, or aria-label.",
      );
    }, [isLabeled]);

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
        className: [
          "inline-flex h-10 items-center justify-center rounded-md bg-[color:var(--primary)] px-4 text-sm font-medium text-[color:var(--primary-foreground)] transition-colors hover:bg-[color:var(--primary-hover)] disabled:pointer-events-none disabled:opacity-50",
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
          "inline-flex h-10 items-center justify-center rounded-md bg-[color:var(--primary)] px-4 text-sm font-medium text-[color:var(--primary-foreground)] transition-colors hover:bg-[color:var(--primary-hover)] disabled:pointer-events-none disabled:opacity-50",
          className,
        ].join(" ")}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
