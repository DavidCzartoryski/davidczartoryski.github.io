import { useId } from "react";

/**
 * The hero's telemetry strip: eight ranks running a synchronous loop, drawn
 * on the server. Each step is compute, then the wait at the barrier, then the
 * all-reduce. Rank 2 computes slowly, so everyone else waits for it every
 * step. The loop is three copies of the same steps, slid left one copy's width by CSS;
 * reduced motion gets the still frame.
 */

const RANKS = [
  { rank: 0, vendor: "NV" },
  { rank: 1, vendor: "NV" },
  { rank: 2, vendor: "NV" },
  { rank: 3, vendor: "NV" },
  { rank: 4, vendor: "AMD" },
  { rank: 5, vendor: "AMD" },
  { rank: 6, vendor: "AMD" },
  { rank: 7, vendor: "AMD" },
] as const;

export const SLOW_RANK = 2;

const AXIS = 26;
const LANE = 30;
const BAR = 14;
const COMM = 18;
const STEPS = 9;
// Normal per-vendor speeds differ; only rank 2 is off its own vendor's pace.
const BASE = { NV: 74, AMD: 80 } as const;
const SLOW = 88;

// Seeded so the server and every visitor draw the same strip.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Step = { x: number; barrier: number; compute: number[] };

function buildSteps(): { steps: Step[]; width: number } {
  const rand = mulberry32(37);
  const steps: Step[] = [];
  let x = 0;
  for (let s = 0; s < STEPS; s++) {
    const compute = RANKS.map(({ rank, vendor }) => {
      const base = rank === SLOW_RANK ? SLOW : BASE[vendor];
      return Math.round(base + (rand() - 0.5) * 7);
    });
    const barrier = Math.max(...compute);
    steps.push({ x, barrier, compute });
    x += barrier + COMM + 6;
  }
  return { steps, width: x };
}

const { steps, width: LOOP } = buildSteps();
const HEIGHT = AXIS + RANKS.length * LANE + 6;

function Loop({ offset, hatch }: { offset: number; hatch: string }) {
  return (
    <g transform={`translate(${offset} 0)`}>
      {steps.map((step, s) => {
        const barrierX = step.x + step.barrier;
        return (
          <g key={s}>
            <line x1={barrierX} x2={barrierX} y1={AXIS - 8} y2={HEIGHT} className="stroke-ar-ink/30" strokeDasharray="2 3" />
            <text x={barrierX + 3} y={AXIS - 12} className="ar-mono fill-ar-faint" fontSize="8.5" letterSpacing="0.06em">
              ALL-REDUCE
            </text>
            {RANKS.map(({ rank }, i) => {
              const y = AXIS + i * LANE + (LANE - BAR) / 2;
              const c = step.compute[i];
              const slow = rank === SLOW_RANK;
              return (
                <g key={rank}>
                  <rect x={step.x} y={y} width={c} height={BAR} rx="2" className={slow ? "fill-ar-signal" : "fill-ar-ink/80"} />
                  {step.barrier - c > 1 && (
                    <rect
                      x={step.x + c + 1}
                      y={y + 0.5}
                      width={step.barrier - c - 1.5}
                      height={BAR - 1}
                      rx="1.5"
                      fill={`url(#${hatch})`}
                      className="stroke-ar-ink/25"
                      strokeWidth="1"
                    />
                  )}
                  <rect x={barrierX + 1} y={y} width={COMM - 2} height={BAR} rx="2" className="fill-ar-ink/25" />
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
}

export default function Lanes() {
  const hatch = `${useId()}-hatch`;
  const slowTop = AXIS + SLOW_RANK * LANE;

  return (
    <div className="relative flex" style={{ height: HEIGHT }}>
      {/* Rank labels stay put while the steps slide under them. */}
      <ol className="ar-mono relative z-10 w-[88px] shrink-0 border-r border-ar-line text-[11px]" style={{ paddingTop: AXIS }}>
        {RANKS.map(({ rank, vendor }) => {
          const slow = rank === SLOW_RANK;
          return (
            <li
              key={rank}
              className={`flex items-center gap-2 pl-4 ${slow ? "font-semibold text-ar-signal-ink" : "text-ar-muted"}`}
              style={{ height: LANE }}
            >
              <span>r{rank}</span>
              <span className={slow ? "" : "text-ar-faint"}>{vendor}</span>
              {slow && <span aria-hidden="true" className="ar-pulse h-1.5 w-1.5 rounded-full bg-ar-signal" />}
            </li>
          );
        })}
      </ol>
      <div className="relative min-w-0 flex-1 overflow-hidden ar-fade-x">
        <div aria-hidden="true" className="absolute inset-x-0 bg-ar-signal/[0.07]" style={{ top: slowTop, height: LANE }} />
        <svg
          width={LOOP * 3}
          height={HEIGHT}
          viewBox={`0 0 ${LOOP * 3} ${HEIGHT}`}
          className="ar-lanes relative block"
          style={{ "--ar-loop": `${LOOP}px`, "--ar-loop-s": `${(LOOP / 42).toFixed(1)}s` } as React.CSSProperties}
          role="img"
          aria-label="Eight GPU ranks, four NVIDIA and four AMD, running training steps. Rank 2 computes slowly, so the other seven wait for it at every all-reduce."
        >
          <defs>
            <pattern id={hatch} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="5" className="stroke-ar-ink/30" strokeWidth="1.3" />
            </pattern>
          </defs>
          <Loop offset={16} hatch={hatch} />
          <Loop offset={16 + LOOP} hatch={hatch} />
          <Loop offset={16 + LOOP * 2} hatch={hatch} />
        </svg>
      </div>
    </div>
  );
}

export function LanesLegend() {
  return (
    <ul className="ar-mono flex flex-wrap items-center gap-x-5 gap-y-2 text-[10.5px] uppercase tracking-[0.08em] text-ar-faint">
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="h-2.5 w-5 rounded-[2px] bg-ar-ink/80" />
        Compute
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="ar-hatch h-2.5 w-5 rounded-[2px] border border-ar-ink/25" />
        Waiting at the barrier
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="h-2.5 w-5 rounded-[2px] bg-ar-ink/25" />
        All-reduce
      </li>
      <li className="flex items-center gap-2 text-ar-signal-ink">
        <span aria-hidden="true" className="h-2.5 w-5 rounded-[2px] bg-ar-signal" />
        Straggler
      </li>
    </ul>
  );
}
