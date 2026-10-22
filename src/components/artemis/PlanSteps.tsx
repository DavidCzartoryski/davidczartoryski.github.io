"use client";

import { useId, useState } from "react";
import { artemis } from "@/data/artemis";

const { detector } = artemis;
const STEPS = [...detector.chain, detector.chainEnd];
const LAST = STEPS.length - 1;

const num = (i: number) => String(i + 1).padStart(2, "0");

/**
 * The rebalancing plan's steps, each a button that drops open what the step
 * says and a sample of what it writes or sends. The last step, the cooldown,
 * keeps its ink cell. Samples use the plan from the hero's strip.
 */
export default function PlanSteps() {
  const uid = useId().replace(/[^\w-]/g, "");
  const [open, setOpen] = useState<number | null>(null);
  // Keeps the last step's content in place while the drawer closes.
  const [shown, setShown] = useState(0);

  function toggle(i: number) {
    setShown(i);
    setOpen((o) => (o === i ? null : i));
  }

  return (
    <div>
      <ol className="mt-6 grid grid-cols-2 gap-px border border-ar-line bg-ar-line md:grid-cols-4">
        {STEPS.map((step, i) => {
          const isOpen = open === i;
          const ink = i === LAST;
          return (
            <li key={step.title} className="flex">
              <button
                type="button"
                id={`${uid}-${i}-button`}
                aria-expanded={isOpen}
                aria-controls={`${uid}-${i}`}
                onClick={() => toggle(i)}
                className={`group flex min-h-[84px] w-full flex-col justify-between gap-3 p-4 text-left transition-colors ${
                  ink
                    ? `bg-ar-fg text-ar-bg ${isOpen ? "shadow-[inset_0_-3px_0_var(--ar-ctl)]" : "hover:opacity-90"}`
                    : isOpen
                      ? "bg-ar-panel shadow-[inset_0_-3px_0_var(--ar-ctl)]"
                      : "bg-ar-bg hover:bg-ar-panel"
                }`}
              >
                <span className="flex w-full items-center justify-between">
                  {ink ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M13 8a5 5 0 1 1-1.6-3.7M13 2.5v2.8h-2.8" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  ) : (
                    <span className={`ar-mono text-[10.5px] ${isOpen ? "text-ar-ctl-ink" : "text-ar-faint"}`}>{num(i)}</span>
                  )}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    className={`transition-transform duration-300 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""} ${
                      ink ? "opacity-60" : "text-ar-faint group-hover:text-ar-fg"
                    }`}
                  >
                    <path d="M3.5 6l4.5 4.5L12.5 6" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </span>
                <span className={`text-[14.5px] font-medium leading-snug ${ink ? "" : "text-ar-fg"}`}>{step.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-[12.5px] text-ar-faint">{detector.chainHint}</p>

      <div
        className={`grid min-w-0 grid-cols-1 transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          open === null ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              id={`${uid}-${i}`}
              role="region"
              aria-labelledby={`${uid}-${i}-button`}
              hidden={shown !== i}
              inert={open !== i}
              className="pt-4"
            >
              <div className="border border-ar-ctl/40 bg-ar-panel p-4 md:p-5">
                <p className="ar-label text-ar-ctl-ink">
                  {num(i)} · {step.title}
                </p>
                <p className="mt-3 text-[15px] leading-[1.6] text-ar-muted">{step.body}</p>
                <p className="ar-mono mt-4 text-[11.5px] text-ar-muted">{step.label}</p>
                <pre className="ar-mono mt-2 overflow-x-auto border border-ar-line bg-ar-bg px-4 py-3 text-[11.5px] leading-[1.8] text-ar-fg">
                  <code>
                    {step.sample.map((line, j) => (
                      <span key={j} className={`block whitespace-pre ${line === "..." ? "text-ar-faint" : ""}`}>
                        {line}
                      </span>
                    ))}
                  </code>
                </pre>
                <p className="mt-3 text-[12.5px] leading-relaxed text-ar-faint">{detector.chainSample}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
