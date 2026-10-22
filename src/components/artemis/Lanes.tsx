"use client";

import { useEffect, useId, useRef } from "react";

/**
 * The hero's telemetry strip: eight ranks running a synchronous loop. Each step
 * is compute, then the wait at the barrier, then the all-reduce. Rank 2 has
 * regressed, so everyone else waits for it every step.
 *
 * `balanced` animates the rebalancing plan in: rank 2 gets fewer samples per
 * step and the others more, in proportion to their speed, with the global batch
 * unchanged. Rank 2 is still the slow GPU per sample; it just stops holding the
 * others up, and the step gets shorter.
 *
 * The first frame is rendered on the server. After that a requestAnimationFrame
 * loop scrolls the strip and writes the geometry straight onto the SVG, so the
 * bars can change width smoothly without a React render per frame. A pool of
 * POOL step groups is reused as steps scroll past. Reduced motion gets a still
 * strip that switches at once, and the setting is followed if it changes.
 */

export const RANKS = [
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

/** Samples per rank per step: equal, then the plan (largest remainders, 256 in total). */
export const BATCH = 32;
export const PLAN = [34, 34, 29, 34, 32, 31, 31, 31] as const;

const AXIS = 26;
const LANE = 30;
const BAR = 14;
const COMM = 18;
const GAP = 6;
const CYCLE = 9;
const POOL = 16;
const SPEED = 42; // px per second
const EASE_S = 0.9;
// Normal per-vendor speeds differ; only rank 2 is off its own vendor's pace.
const BASE = { NV: 74, AMD: 80 } as const;
const SLOW = 88;
const START_X = 16;

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

const NOISE: number[][] = (() => {
  const rand = mulberry32(37);
  return Array.from({ length: CYCLE }, () => RANKS.map(() => (rand() - 0.5) * 7));
})();

/** Time per sample, in the strip's units. */
const PER_SAMPLE = RANKS.map(({ rank, vendor }) => (rank === SLOW_RANK ? SLOW : BASE[vendor]) / BATCH);

type Step = { compute: number[]; barrier: number; width: number };

/** Step k with the plan `t` of the way in (0 = equal batches, 1 = the plan). */
function step(k: number, t: number): Step {
  const noise = NOISE[k % CYCLE];
  const compute = RANKS.map((_, r) => (BATCH + (PLAN[r] - BATCH) * t) * PER_SAMPLE[r] + noise[r]);
  const barrier = Math.max(...compute);
  return { compute, barrier, width: barrier + COMM + GAP };
}

/** Mean step time (compute to the barrier plus the all-reduce), before and after the plan. */
export const STEP_CHANGE = (() => {
  const mean = (t: number) => {
    let sum = 0;
    for (let k = 0; k < CYCLE; k++) sum += step(k, t).barrier + COMM;
    return sum / CYCLE;
  };
  return mean(1) / mean(0) - 1;
})();

const HEIGHT = AXIS + RANKS.length * LANE + 6;
const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
const laneY = (i: number) => AXIS + i * LANE + (LANE - BAR) / 2;

/** Writes step `s` into a group's elements. */
function paint(g: SVGGElement, s: Step) {
  const line = g.children[0] as SVGLineElement;
  const label = g.children[1] as SVGTextElement;
  line.setAttribute("x1", s.barrier.toFixed(2));
  line.setAttribute("x2", s.barrier.toFixed(2));
  label.setAttribute("x", (s.barrier + 3).toFixed(2));
  for (let r = 0; r < RANKS.length; r++) {
    const c = s.compute[r];
    const [bar, wait, comm] = [g.children[2 + r * 3], g.children[3 + r * 3], g.children[4 + r * 3]] as SVGRectElement[];
    bar.setAttribute("width", c.toFixed(2));
    const w = s.barrier - c - 1.5;
    wait.setAttribute("x", (c + 1).toFixed(2));
    wait.setAttribute("width", Math.max(0, w).toFixed(2));
    wait.style.visibility = w > 0.5 ? "visible" : "hidden";
    comm.setAttribute("x", (s.barrier + 1).toFixed(2));
  }
}

function StepGroup({ s, x, hatch }: { s: Step; x: number; hatch: string }) {
  return (
    <g transform={`translate(${x.toFixed(2)} 0)`}>
      <line x1={s.barrier} x2={s.barrier} y1={AXIS - 8} y2={HEIGHT} className="stroke-ar-fg/25" strokeDasharray="2 3" />
      <text x={s.barrier + 3} y={AXIS - 12} className="ar-mono fill-ar-faint" fontSize="8.5" letterSpacing="0.06em">
        ALL-REDUCE
      </text>
      {RANKS.map(({ rank }, i) => {
        const c = s.compute[i];
        const w = s.barrier - c - 1.5;
        return [
          <rect
            key={`c${rank}`}
            x={0}
            y={laneY(i)}
            width={c}
            height={BAR}
            rx="2"
            className={rank === SLOW_RANK ? "fill-ar-signal" : "fill-ar-fg/70"}
          />,
          <rect
            key={`w${rank}`}
            x={c + 1}
            y={laneY(i) + 0.5}
            width={Math.max(0, w)}
            height={BAR - 1}
            rx="1.5"
            fill={`url(#${hatch})`}
            className="stroke-ar-fg/20"
            strokeWidth="1"
            style={{ visibility: w > 0.5 ? "visible" : "hidden" }}
          />,
          <rect key={`m${rank}`} x={s.barrier + 1} y={laneY(i)} width={COMM - 2} height={BAR} rx="2" className="fill-ar-fg/20" />,
        ];
      })}
    </g>
  );
}

// The server's first frame, and the client's until the loop takes over.
const FIRST = (() => {
  let x = START_X;
  return Array.from({ length: POOL }, (_, k) => {
    const s = step(k, 0);
    const out = { s, x };
    x += s.width;
    return out;
  });
})();

export default function Lanes({ balanced }: { balanced: boolean }) {
  const hatch = `${useId()}-hatch`;
  const strip = useRef<SVGGElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const target = useRef(balanced ? 1 : 0);
  const wake = useRef<() => void>(() => {});

  useEffect(() => {
    target.current = balanced ? 1 : 0;
    wake.current();
  }, [balanced]);

  useEffect(() => {
    const groups = strip.current ? (Array.from(strip.current.children) as SVGGElement[]) : [];
    if (!groups.length || !box.current) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motion.matches;

    let progress = target.current; // 0..1, eased into t
    let k0 = 0; // the step at the left edge
    let x0 = START_X; // its x
    const owner = groups.map((_, g) => g); // which step each group shows
    let raf = 0;
    let last = 0;
    let visible = true;

    const layout = (moved: number, force: boolean) => {
      const t = ease(progress);
      x0 -= moved;
      let s = step(k0, t);
      while (x0 + s.width < 0) {
        x0 += s.width;
        k0 += 1;
        s = step(k0, t);
      }
      let x = x0;
      for (let k = k0; k < k0 + POOL; k++) {
        const slot = k % POOL;
        const g = groups[slot];
        const sk = k === k0 ? s : step(k, t);
        if (force || owner[slot] !== k) {
          paint(g, sk);
          owner[slot] = k;
        }
        g.setAttribute("transform", `translate(${x.toFixed(2)} 0)`);
        x += sk.width;
      }
    };

    const frame = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      const goal = target.current;
      const moving = progress !== goal;
      if (moving) {
        progress = goal > progress ? Math.min(goal, progress + dt / EASE_S) : Math.max(goal, progress - dt / EASE_S);
      }
      layout(reduced ? 0 : SPEED * dt, moving);
      // Keep going while scrolling; under reduced motion only until the switch lands.
      if (visible && (!reduced || progress !== target.current)) raf = requestAnimationFrame(frame);
      else raf = 0;
    };

    const start = () => {
      if (raf) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };

    wake.current = () => {
      if (reduced) {
        progress = target.current;
        layout(0, true);
      } else if (visible) start();
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !reduced) start();
    });
    io.observe(box.current);
    if (!reduced) start();

    // The setting can change while the page is open.
    const onMotion = () => {
      reduced = motion.matches;
      if (reduced) {
        cancelAnimationFrame(raf);
        raf = 0;
        progress = target.current;
        layout(0, true);
      } else if (visible) start();
    };
    motion.addEventListener("change", onMotion);

    return () => {
      io.disconnect();
      motion.removeEventListener("change", onMotion);
      cancelAnimationFrame(raf);
      wake.current = () => {};
    };
  }, []);

  const slowTop = AXIS + SLOW_RANK * LANE;

  return (
    <div ref={box} className="relative flex" style={{ height: HEIGHT }}>
      {/* Rank labels stay put while the steps slide under them. */}
      <ol className="ar-mono relative z-10 w-[76px] shrink-0 border-r border-ar-line text-[11px] sm:w-[88px]" style={{ paddingTop: AXIS }}>
        {RANKS.map(({ rank, vendor }) => {
          const slow = rank === SLOW_RANK;
          return (
            <li
              key={rank}
              className={`flex items-center gap-2 pl-3 sm:pl-4 ${slow ? "font-semibold text-ar-signal-ink" : "text-ar-muted"}`}
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
        <div aria-hidden="true" className="absolute inset-x-0 bg-ar-signal/[0.09]" style={{ top: slowTop, height: LANE }} />
        <svg
          width="100%"
          height={HEIGHT}
          className="relative block"
          role="img"
          aria-label={
            balanced
              ? "Eight GPU ranks, four NVIDIA and four AMD, after rebalancing. Rank 2 now gets fewer samples and the other seven a few more, so all eight reach each all-reduce at about the same time and the step is shorter."
              : "Eight GPU ranks, four NVIDIA and four AMD, running training steps. Rank 2 has regressed and computes slowly, so the other seven wait for it at every all-reduce."
          }
        >
          <defs>
            <pattern id={hatch} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="5" className="stroke-ar-fg/30" strokeWidth="1.3" />
            </pattern>
          </defs>
          <g ref={strip}>
            {FIRST.map(({ s, x }, k) => (
              <StepGroup key={k} s={s} x={x} hatch={hatch} />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}

export function LanesLegend() {
  return (
    <ul className="ar-mono flex flex-wrap items-center gap-x-5 gap-y-2 text-[10.5px] uppercase tracking-[0.08em] text-ar-muted">
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="h-2.5 w-5 rounded-[2px] bg-ar-fg/70" />
        Compute
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="ar-hatch h-2.5 w-5 rounded-[2px] border border-ar-fg/20" />
        Waiting at the barrier
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="h-2.5 w-5 rounded-[2px] bg-ar-fg/20" />
        All-reduce
      </li>
      <li className="flex items-center gap-2 text-ar-fg">
        <span aria-hidden="true" className="h-2.5 w-5 rounded-[2px] bg-ar-signal" />
        The regressed rank
      </li>
    </ul>
  );
}
