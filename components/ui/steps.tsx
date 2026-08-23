import * as React from "react";

type StepItem = {
  title: string;
  description?: string;
};

type StepsProps = {
  steps: ReadonlyArray<StepItem>;
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
                ? "border-[color:var(--primary)] bg-[color:var(--surface-strong)]"
                : "border-[color:var(--border)] bg-[color:var(--surface)]",
            ].join(" ")}
          >
            <span
              className={[
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                active || completed
                  ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                  : "bg-[color:var(--surface-strong)] text-[color:var(--muted-foreground)]",
              ].join(" ")}
            >
              {stepNumber}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[color:var(--foreground)]">
                {step.title}
              </p>
              {step.description ? (
                <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">{step.description}</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
