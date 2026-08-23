"use client";

import * as React from "react";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = React.useContext(TabsContext);

  if (!context) {
    throw new Error("Tabs components must be used within Tabs.");
  }

  return context;
}

export function Tabs({
  defaultValue,
  children,
}: {
  defaultValue: string;
  children: React.ReactNode;
}) {
  const [value, setValue] = React.useState(defaultValue);

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex w-full flex-wrap gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-2 backdrop-blur">
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  const { value: activeValue, setValue } = useTabsContext();
  const active = activeValue === value;

  return (
    <button
      type="button"
      onClick={() => setValue(value)}
      aria-pressed={active}
      className={`inline-flex flex-1 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
          : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--foreground)]"
      }`}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  const { value: activeValue } = useTabsContext();

  if (activeValue !== value) {
    return null;
  }

  return <div className="mt-6">{children}</div>;
}
