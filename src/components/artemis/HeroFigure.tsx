"use client";

import { useState } from "react";
import { artemis } from "@/data/artemis";
import { Ticks } from "./bits";
import Lanes, { BATCH, LanesLegend, PLAN, STEP_CHANGE } from "./Lanes";

const { hero } = artemis;

const pct = `${STEP_CHANGE < 0 ? "−" : "+"}${Math.abs(STEP_CHANGE * 100).toFixed(1)}%`;

/** What the finding about the strip would carry. Illustrative values, real field names. */
const FINDING = [
  ["kind", "rank"],
  ["state", "flagged"],
  ["rank", "2"],
  ["island", "nvidia"],
  ["ratio", "1.19"],
  ["excess_ms", "+8.1 per step"],
  ["loss_pct", "7.6"],
  ["cause", "clocks"],
] as const;

/** The plan that answers it: samples per rank, from the same numbers the strip draws. */
const APPLIED = [
  ["kind", "rebalance"],
  ["state", "applied"],
  ["rank 2", `${BATCH} → ${PLAN[2]} samples`],
  ["r0, r1, r3", `${BATCH} → ${PLAN[0]}`],
  ["r4 to r7", `${BATCH} → ${Math.min(...PLAN.slice(4))} or ${Math.max(...PLAN.slice(4))}`],
  ["global", `${PLAN.reduce((a, b) => a + b, 0)}, unchanged`],
  ["step time", pct],
] as const;

function Readout({ balanced, touched }: { balanced: boolean; touched: boolean }) {
  const rows = balanced ? APPLIED : FINDING;
  const base = { "--ar-type-base": touched ? "80ms" : "1100ms" } as React.CSSProperties;
  return (
    <div className="ar-mono relative border border-ar-line-2 bg-ar-panel p-4 text-[11.5px] leading-relaxed lg:w-[290px]">
      <p
        className={`flex items-center gap-2 border-b border-ar-line pb-3 text-[10.5px] uppercase tracking-[0.12em] ${
          balanced ? "text-ar-ctl-ink" : "text-ar-signal-ink"
        }`}
      >
        <span aria-hidden="true" className={`ar-pulse h-2 w-2 rounded-full ${balanced ? "bg-ar-ctl" : "bg-ar-signal"}`} />
        {balanced ? "Plan 1 · applied" : "Finding · window 37"}
      </p>
      <dl key={balanced ? "plan" : "finding"} className="mt-3 grid grid-cols-[88px_1fr] gap-y-1.5" style={base}>
        {rows.map(([k, v], i) => {
          const delay = { "--ar-i": i } as React.CSSProperties;
          const strong = k === "excess_ms" || k === "step time";
          return (
            <div key={k} className="contents">
              <dt className="ar-type text-ar-faint" style={delay}>
                {k}
              </dt>
              <dd
                className={`ar-type ${strong ? `font-semibold ${balanced ? "text-ar-ctl-ink" : "text-ar-signal-ink"}` : "text-ar-fg"}`}
                style={delay}
              >
                {v}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

/** The hero's strip with the one action Artemis can take on it: rebalance, then put it back. */
export default function HeroFigure() {
  const [balanced, setBalanced] = useState(false);
  const [touched, setTouched] = useState(false);

  function toggle() {
    setTouched(true);
    setBalanced((b) => !b);
  }

  return (
    <figure>
      <div className="relative border border-ar-line-2 bg-ar-panel/70">
        <Ticks />
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-ar-line px-4 py-2.5">
          <span className="ar-label text-ar-faint">Job 0x2a · 8 ranks · data parallel</span>
          <button
            type="button"
            onClick={toggle}
            aria-controls="hero-lanes"
            className={
              balanced
                ? "ar-label inline-flex h-8 items-center gap-2 rounded-full border border-ar-line-2 px-3.5 text-[10.5px] text-ar-fg transition-colors hover:border-ar-fg/60"
                : "inline-flex h-8 items-center gap-2 rounded-full bg-ar-signal px-4 text-[13px] font-semibold text-ar-bg shadow-[0_0_0_4px_rgb(238_92_54/0.15)] transition-[filter,box-shadow] hover:shadow-[0_0_0_6px_rgb(238_92_54/0.2)] hover:brightness-110"
            }
          >
            {balanced ? (
              <>
                <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3 8a5 5 0 1 0 1.6-3.7M3 2.5v2.8h2.8" fill="none" stroke="currentColor" strokeWidth="1.6" />
                </svg>
                Reset
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M2 5h10.5M9.5 2l3 3-3 3M14 11H3.5M6.5 8l-3 3 3 3" fill="none" stroke="currentColor" strokeWidth="1.6" />
                </svg>
                Rebalance
              </>
            )}
          </button>
        </div>
        <div id="hero-lanes" className="relative">
          <Lanes balanced={balanced} />
          <div className="hidden lg:absolute lg:inset-y-4 lg:right-4 lg:flex lg:items-center">
            <Readout balanced={balanced} touched={touched} />
          </div>
        </div>
        <div className="border-t border-ar-line p-4 lg:hidden">
          <Readout balanced={balanced} touched={touched} />
        </div>
      </div>
      <figcaption className="mt-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-8">
        <LanesLegend />
        <p className="max-w-[480px] text-[13px] leading-relaxed text-ar-faint md:text-right" aria-live="polite">
          {balanced ? hero.captionBalanced : hero.caption}
        </p>
      </figcaption>
    </figure>
  );
}
