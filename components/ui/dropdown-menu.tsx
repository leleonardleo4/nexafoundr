"use client";

import * as React from "react";

type DropdownMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext() {
  const context = React.useContext(DropdownMenuContext);

  if (!context) {
    throw new Error("DropdownMenu components must be used within DropdownMenu.");
  }

  return context;
}

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  const { open, setOpen } = useDropdownMenuContext();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<{
        onClick?: () => void;
        "aria-haspopup"?: string;
        "aria-expanded"?: boolean;
      }>,
      {
        onClick: () => setOpen(!open),
        "aria-haspopup": "menu",
        "aria-expanded": open,
      },
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      aria-haspopup="menu"
      aria-expanded={open}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  children,
  align = "end",
}: {
  children: React.ReactNode;
  align?: "start" | "end";
}) {
  const { open, setOpen } = useDropdownMenuContext();

  React.useEffect(() => {
    if (!open) {
      return;
    }

    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as Element | null;

      if (!target?.closest?.("[data-dropdown-menu-root='true']")) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, [open, setOpen]);

  if (!open) {
    return null;
  }

  return (
    <div
      data-dropdown-menu-root="true"
      className={`absolute top-full z-50 mt-2 w-56 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-2 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.35)] backdrop-blur ${
        align === "end" ? "right-0" : "left-0"
      }`}
    >
      {children}
    </div>
  );
}

export function DropdownMenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-2 text-sm font-medium text-[color:var(--muted-foreground)]">{children}</div>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-2 h-px bg-[color:var(--border)]" />;
}

export function DropdownMenuItem({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const { setOpen } = useDropdownMenuContext();

  return (
    <button
      type="button"
      onClick={() => {
        onClick?.();
        setOpen(false);
      }}
      className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-[color:var(--foreground)] transition hover:bg-[color:var(--surface)] ${className}`}
    >
      {children}
    </button>
  );
}
