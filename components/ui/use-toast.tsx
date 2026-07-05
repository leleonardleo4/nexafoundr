"use client";

import * as React from "react";

type ToastVariant = "default" | "destructive";

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastItem = ToastInput & {
  id: number;
};

const listeners = new Set<React.Dispatch<React.SetStateAction<ToastItem[]>>>();
let nextToastId = 0;
let toasts: ToastItem[] = [];

function publish() {
  for (const listener of listeners) {
    listener(toasts);
  }
}

function dismissToast(id: number) {
  toasts = toasts.filter((toastItem) => toastItem.id !== id);
  publish();
}

export function toast(input: ToastInput) {
  const id = ++nextToastId;
  const toastItem: ToastItem = {
    id,
    variant: "default",
    duration: 4000,
    ...input,
  };

  toasts = [toastItem, ...toasts].slice(0, 3);
  publish();

  if (toastItem.duration !== 0) {
    globalThis.setTimeout(() => dismissToast(id), toastItem.duration);
  }
}

export function Toaster() {
  const [state, setState] = React.useState(toasts);

  React.useEffect(() => {
    listeners.add(setState);

    return () => {
      listeners.delete(setState);
    };
  }, []);

  return (
    <div className="fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
      {state.map((toastItem) => (
        <div
          key={toastItem.id}
          className={[
            "rounded-lg border p-4 shadow-lg backdrop-blur",
            toastItem.variant === "destructive"
              ? "border-red-200 bg-red-50 text-red-950"
              : "border-neutral-200 bg-white text-foreground dark:border-neutral-800 dark:bg-zinc-950",
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="font-medium">{toastItem.title}</p>
              {toastItem.description ? (
                <p className="text-sm opacity-90">{toastItem.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Dismiss toast"
              className="text-sm opacity-60 transition-opacity hover:opacity-100"
              onClick={() => dismissToast(toastItem.id)}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
