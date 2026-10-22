"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Why step time alone can't find a regression: two small multiples on one
 * shared window axis. Top, the job's step time, which every rank sees. Bottom,
 * each rank's compute against its island's median, which is what the detector
 * scores; rank 2 regresses at window 16, is suspect in 16 and 17 and flagged at
 * 18 (3 suspect windows out of the last 4). Synthetic, seeded data.
 *
 * Measured in px rather than scaled through a viewBox, so the labels stay
 * legible on a phone. Until the first measurement (and on the server) it draws
 * at 720 px through a viewBox, scaled to fit. Hover, touch or the arrow keys
 * move a crosshair; the same numbers are in the table underneath.
 */

const WINDOWS = 32;
const ONSET = 16;
const SUSPECT = [16, 17];
const FLAGGED = 18;
const SLOW = 2;
const RANKS = 8;
const STEPS = 50;
const THRESHOLD = 1.1;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Window = { step: number; pace: number[]; peers: number };

const DATA: Window[] = (() => {
  const rand = mulberry32(11);
  const jitter = () => rand() - 0.5;
  return Array.from({ length: WINDOWS }, (_, w) => {
    const after = w >= ONSET;
    const pace = Array.from({ length: RANKS }, (_, r) =>
      r === SLOW && after ? 1.14 + jitter() * 0.018 : 1 + jitter() * 0.026,
    );
    const others = pace.filter((_, r) => r !== SLOW).sort((a, b) => a - b);
    const peers = others[3]; // median of the seven
    return { step: (after ? 110.6 : 100) + jitter() * 1.2, pace, peers };
  });
})();

const STEP_DOMAIN = [94, 116] as const;
const PACE_DOMAIN = [0.94, 1.2] as const;

const fmtMs = (v: number) => `${v.toFixed(1)} ms`;
const fmtX = (v: number) => `${v.toFixed(2)}×`;

export default function RegressionChart() {
  const wrap = useRef<HTMLDivElement>(null);
  const [measured, setWidth] = useState<number | null>(null);
  const width = measured ?? 720;
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const narrow = width < 520;
  const ml = narrow ? 38 : 48;
  const mr = narrow ? 50 : 64;
  const plotW = Math.max(120, width - ml - mr);
  const aTop = 30;
  const aH = narrow ? 76 : 96;
  const bTop = aTop + aH + 44;
  const bH = narrow ? 132 : 160;
  const height = bTop + bH + 34;

  const x = (w: number) => ml + (w / (WINDOWS - 1)) * plotW;
  const yA = (v: number) => aTop + (1 - (v - STEP_DOMAIN[0]) / (STEP_DOMAIN[1] - STEP_DOMAIN[0])) * aH;
  const yB = (v: number) => bTop + (1 - (v - PACE_DOMAIN[0]) / (PACE_DOMAIN[1] - PACE_DOMAIN[0])) * bH;
  const path = (ys: number[]) => ys.map((y, w) => `${w ? "L" : "M"}${x(w).toFixed(1)} ${y.toFixed(1)}`).join("");

  const onsetX = (x(ONSET - 1) + x(ONSET)) / 2;
  const last = DATA[WINDOWS - 1];

  function windowAt(clientX: number) {
    const box = wrap.current?.getBoundingClientRect();
    if (!box) return null;
    const w = Math.round(((clientX - box.left - ml) / plotW) * (WINDOWS - 1));
    return Math.min(WINDOWS - 1, Math.max(0, w));
  }

  function onKey(e: React.KeyboardEvent) {
    const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowUp: 1, ArrowDown: -1 };
    if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      setHover(e.key === "Home" ? 0 : WINDOWS - 1);
    } else if (e.key in moves) {
      e.preventDefault();
      setHover((h) => Math.min(WINDOWS - 1, Math.max(0, (h ?? ONSET - 1) + moves[e.key])));
    } else if (e.key === "Escape") {
      setHover(null);
    }
  }

  const hw = hover === null ? null : DATA[hover];
  const status = (w: number) => (w >= FLAGGED ? "flagged" : SUSPECT.includes(w) ? "suspect" : "healthy");

  return (
    <div>
      <ul className="ar-mono flex flex-wrap gap-x-5 gap-y-2 text-[10.5px] uppercase tracking-[0.08em] text-ar-muted">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-0.5 w-5 rounded-full bg-ar-signal" />
          Rank 2, regressed
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-0.5 w-5 rounded-full bg-ar-fg/30" />
          The other 7 ranks
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-2 w-2 rounded-full border-2 border-ar-signal" />
          Suspect window
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-ar-signal" />
          Flagged
        </li>
      </ul>

      <div
        ref={wrap}
        className="relative mt-5 w-full min-w-0 touch-pan-y overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-ar-fg/60"
        tabIndex={0}
        role="group"
        aria-label="Chart of step time and per-rank compute over 32 windows. Use the arrow keys to read each window."
        onKeyDown={onKey}
        onPointerMove={(e) => setHover(windowAt(e.clientX))}
        onPointerDown={(e) => setHover(windowAt(e.clientX))}
        onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}
        onBlur={() => setHover(null)}
      >
        <svg
          {...(measured === null
            ? { viewBox: `0 0 ${width} ${height}`, className: "block h-auto w-full" }
            : { width, height, className: "block" })}
          aria-hidden="true"
        >
          {/* Panel A: job step time. */}
          <text x={ml} y={aTop - 14} className="ar-mono fill-ar-muted" fontSize="10.5" letterSpacing="0.06em">
            STEP TIME · MS
          </text>
          {[100, 110].map((v) => (
            <g key={v}>
              <line x1={ml} x2={ml + plotW} y1={yA(v)} y2={yA(v)} className="stroke-ar-fg/10" />
              <text x={ml - 8} y={yA(v) + 3.5} textAnchor="end" className="ar-mono fill-ar-faint" fontSize="10">
                {v}
              </text>
            </g>
          ))}
          <path d={path(DATA.map((d) => yA(d.step)))} fill="none" className="stroke-ar-fg/80" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={x(WINDOWS - 1)} cy={yA(last.step)} r="4" className="fill-ar-fg stroke-ar-panel" strokeWidth="2" />
          <text x={x(WINDOWS - 1) + 10} y={yA(last.step) + 3.5} className="ar-mono fill-ar-fg" fontSize="10.5">
            +{Math.round(last.step - 100)}%
          </text>

          {/* The onset, through both panels. */}
          <line x1={onsetX} x2={onsetX} y1={aTop - 8} y2={aTop + aH + 6} className="stroke-ar-signal/60" />
          <line x1={onsetX} x2={onsetX} y1={bTop - 6} y2={bTop + bH} className="stroke-ar-signal/60" />
          <text x={onsetX + 6} y={aTop - 14} className="ar-mono fill-ar-signal-ink" fontSize="10.5" letterSpacing="0.06em">
            REGRESSION STARTS
          </text>

          {/* Panel B: compute against the island's median. */}
          <text x={ml} y={bTop - 14} className="ar-mono fill-ar-muted" fontSize="10.5" letterSpacing="0.06em">
            {narrow ? "COMPUTE ÷ PEERS" : "COMPUTE ÷ ISLAND MEDIAN"}
          </text>
          {[1, 1.1, 1.2].map((v) => (
            <g key={v}>
              {v !== THRESHOLD && <line x1={ml} x2={ml + plotW} y1={yB(v)} y2={yB(v)} className="stroke-ar-fg/10" />}
              <text x={ml - 8} y={yB(v) + 3.5} textAnchor="end" className="ar-mono fill-ar-faint" fontSize="10">
                {v.toFixed(1)}×
              </text>
            </g>
          ))}
          <line x1={ml} x2={ml + plotW} y1={yB(THRESHOLD)} y2={yB(THRESHOLD)} className="stroke-ar-fg/40" strokeDasharray="3 4" />
          <text x={ml + 6} y={yB(THRESHOLD) + 14} className="ar-mono fill-ar-faint" fontSize="10">
            {narrow ? "suspect above" : "suspect above, about 10% over peers"}
          </text>
          {Array.from({ length: RANKS }, (_, r) => r)
            .filter((r) => r !== SLOW)
            .map((r) => (
              <path
                key={r}
                d={path(DATA.map((d) => yB(d.pace[r])))}
                fill="none"
                className="stroke-ar-fg/25"
                strokeWidth="1.25"
                strokeLinejoin="round"
              />
            ))}
          <path
            d={path(DATA.map((d) => yB(d.pace[SLOW])))}
            fill="none"
            className="stroke-ar-panel"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path
            d={path(DATA.map((d) => yB(d.pace[SLOW])))}
            fill="none"
            className="stroke-ar-signal"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {SUSPECT.map((w) => (
            <circle key={w} cx={x(w)} cy={yB(DATA[w].pace[SLOW])} r="4" className="fill-ar-panel stroke-ar-signal" strokeWidth="2" />
          ))}
          <circle cx={x(FLAGGED)} cy={yB(DATA[FLAGGED].pace[SLOW])} r="5.5" className="fill-ar-signal stroke-ar-panel" strokeWidth="2" />
          <text x={x(FLAGGED) + (narrow ? 8 : 0)} y={yB(DATA[FLAGGED].pace[SLOW]) - 15} textAnchor="middle" className="ar-mono fill-ar-fg" fontSize="10.5">
            flagged
          </text>
          <text x={x(WINDOWS - 1) + 10} y={yB(last.pace[SLOW]) + 3.5} className="ar-mono fill-ar-fg" fontSize="10.5">
            rank 2
          </text>
          <text x={x(WINDOWS - 1) + 10} y={yB(1) + 3.5} className="ar-mono fill-ar-faint" fontSize="10.5">
            peers
          </text>

          {/* Window axis. */}
          <line x1={ml} x2={ml + plotW} y1={bTop + bH} y2={bTop + bH} className="stroke-ar-fg/20" />
          {[0, 8, 16, 24, 31].map((w) => (
            <text key={w} x={x(w)} y={bTop + bH + 16} textAnchor="middle" className="ar-mono fill-ar-faint" fontSize="10">
              {w}
            </text>
          ))}
          <text x={ml + plotW} y={bTop + bH + 30} textAnchor="end" className="ar-mono fill-ar-faint" fontSize="10">
            window · 50 steps each
          </text>

          {hover !== null && hw && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={aTop - 4} y2={bTop + bH} className="stroke-ar-fg/50" />
              <circle cx={x(hover)} cy={yA(hw.step)} r="4" className="fill-ar-fg stroke-ar-panel" strokeWidth="2" />
              <circle cx={x(hover)} cy={yB(hw.pace[SLOW])} r="4" className="fill-ar-signal stroke-ar-panel" strokeWidth="2" />
            </g>
          )}
        </svg>

        {hover !== null && hw && (
          <div
            className="ar-mono pointer-events-none absolute top-0 z-10 w-[188px] border border-ar-line-2 bg-ar-bg/95 p-3 text-[11px] leading-relaxed text-ar-fg shadow-xl backdrop-blur"
            style={hover > WINDOWS / 2 ? { left: Math.max(0, x(hover) - 200) } : { left: Math.min(width - 188, x(hover) + 12) }}
          >
            <p className="text-ar-faint">
              Window {hover} · steps {hover * STEPS}–{hover * STEPS + STEPS - 1}
            </p>
            <dl className="mt-1.5 grid grid-cols-[1fr_auto] gap-x-3">
              <dt className="text-ar-muted">Step time</dt>
              <dd className="text-right">{fmtMs(hw.step)}</dd>
              <dt className="text-ar-muted">Rank 2</dt>
              <dd className="text-right">{fmtX(hw.pace[SLOW])}</dd>
              <dt className="text-ar-muted">Peer median</dt>
              <dd className="text-right">{fmtX(hw.peers)}</dd>
            </dl>
            <p className={`mt-1.5 uppercase tracking-[0.08em] ${status(hover) === "healthy" ? "text-ar-faint" : "text-ar-signal-ink"}`}>
              {status(hover)}
            </p>
          </div>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {hover !== null && hw
          ? `Window ${hover}: step time ${fmtMs(hw.step)}, rank 2 ${fmtX(hw.pace[SLOW])}, peer median ${fmtX(hw.peers)}, ${status(hover)}.`
          : ""}
      </p>

      <details className="group mt-5 border-t border-ar-line pt-4">
        <summary className="ar-label cursor-pointer list-none text-ar-faint transition-colors hover:text-ar-fg">
          <span className="mr-2 inline-block transition-transform group-open:rotate-90" aria-hidden="true">
            ›
          </span>
          The numbers as a table
        </summary>
        <div className="mt-4 max-h-[280px] overflow-y-auto">
          <table className="ar-mono w-full text-left text-[11.5px] tabular-nums">
            <caption className="sr-only">Step time and compute ratio per window, synthetic data</caption>
            <thead className="sticky top-0 bg-ar-panel text-ar-faint">
              <tr>
                <th scope="col" className="py-1.5 font-normal">Window</th>
                <th scope="col" className="py-1.5 text-right font-normal">Step time</th>
                <th scope="col" className="py-1.5 text-right font-normal">Rank 2</th>
                <th scope="col" className="py-1.5 text-right font-normal">Peer median</th>
                <th scope="col" className="py-1.5 pl-4 font-normal">State</th>
              </tr>
            </thead>
            <tbody className="text-ar-muted">
              {DATA.map((d, w) => (
                <tr key={w} className="border-t border-ar-line">
                  <td className="py-1">{w}</td>
                  <td className="py-1 text-right">{fmtMs(d.step)}</td>
                  <td className="py-1 text-right">{fmtX(d.pace[SLOW])}</td>
                  <td className="py-1 text-right">{fmtX(d.peers)}</td>
                  <td className={`py-1 pl-4 ${status(w) === "healthy" ? "" : "text-ar-signal-ink"}`}>{status(w)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
