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
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(!open),
    });
  }

  return (
    <button type="button" onClick={() => setOpen(!open)}>
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
      className={`absolute top-full z-50 mt-2 w-56 rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg shadow-zinc-950/5 dark:border-zinc-800 dark:bg-zinc-900 ${
        align === "end" ? "right-0" : "left-0"
      }`}
    >
      {children}
    </div>
  );
}

export function DropdownMenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-2 text-sm font-medium text-zinc-500">{children}</div>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-2 h-px bg-zinc-200 dark:bg-zinc-800" />;
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
      className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 ${className}`}
    >
      {children}
    </button>
  );
}
