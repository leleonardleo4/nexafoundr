import * as React from "react";

type StepItem = {
  title: string;
  description?: string;
};

type StepsProps = {
  steps: StepItem[];
  currentStep: number;
};

export function Steps({ steps, currentStep }: StepsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const active = stepNumber === currentStep;
        const completed = stepNumber < currentStep;

        return (
          <div
            key={step.title}
            className={[
              "flex items-start gap-3 rounded-md border p-4 transition-colors",
              active || completed
                ? "border-zinc-950 bg-zinc-50 dark:border-zinc-50 dark:bg-zinc-900"
                : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950",
            ].join(" ")}
          >
            <span
              className={[
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                active || completed
                  ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
              ].join(" ")}
            >
              {stepNumber}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                {step.title}
              </p>
              {step.description ? (
                <p className="mt-1 text-xs text-zinc-500">{step.description}</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
