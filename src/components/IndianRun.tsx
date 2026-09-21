"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

/**
 * The straggler problem, told as an Indian run around a soccer pitch: the team
 * rotates one sprinter at a time, so the drill only ends once the slowest
 * player has finished all of their reps. Drag the slider to slow one runner
 * down, then swap them out and watch the drill snap back.
 */

const RUNNERS = 6;
/** Which runner is the straggler. */
const SLOW_ID = 3;
/** Times each runner has to reach the front before the drill ends. */
const ROTATIONS = 3;
/** Drill-clock seconds one healthy sprint costs. */
const BASE_SPRINT_S = 20;
/** On-screen milliseconds one healthy sprint takes. */
const HEALTHY_MS = 1000;
/** Pitch-perimeter pixels the jogging formation covers per millisecond. */
const JOG = 0.04;
/** Gap between runners in the line, in perimeter pixels. */
const SPACING = 48;

// Pitch geometry, walked clockwise from the top-left corner.
const X1 = 62;
const Y1 = 58;
const X2 = 538;
const Y2 = 242;
const W = X2 - X1;
const H = Y2 - Y1;
const PERIM = 2 * (W + H);
const R = 13;
const LANE = 21;

/** Point and outward normal at a distance along the pitch perimeter. */
function onPerimeter(d: number) {
  let t = ((d % PERIM) + PERIM) % PERIM;
  if (t < W) return { x: X1 + t, y: Y1, nx: 0, ny: -1 };
  t -= W;
  if (t < H) return { x: X2, y: Y1 + t, nx: 1, ny: 0 };
  t -= H;
  if (t < W) return { x: X2 - t, y: Y2, nx: 0, ny: 1 };
  t -= W;
  return { x: X1, y: Y2 - t, nx: -1, ny: 0 };
}

function clock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const NARRATIVE = [
  "AI training models currently have a problem.",
  "It is one the top AI research labs are competing to solve.",
  "How do you speed up training?",
  "It is a problem I have picked up and am tackling too.",
];

type Sim = { order: number[]; p: number; base: number };

export default function IndianRun() {
  const [slow, setSlow] = useState(2.2);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [sim, setSim] = useState<Sim>({ order: [0, 1, 2, 3, 4, 5], p: 0, base: 0 });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (paused || reduced) return;
    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      // Clamp dt so a backgrounded tab doesn't teleport the formation.
      const dt = Math.min(now - last, 50);
      last = now;

      setSim((s) => {
        const sprinter = s.order[RUNNERS - 1];
        const duration = HEALTHY_MS * (sprinter === SLOW_ID ? slow : 1);
        const base = s.base + JOG * dt;
        const p = s.p + dt / duration;
        // Sprint done: the sprinter takes the front, so the line's head
        // advances by exactly one gap and everyone else shifts back a slot.
        if (p >= 1) {
          return { order: [sprinter, ...s.order.slice(0, RUNNERS - 1)], p: 0, base: base + SPACING };
        }
        return { order: s.order, p, base };
      });

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [paused, reduced, slow]);

  const { order, p, base } = sim;
  const sprinterId = order[RUNNERS - 1];

  const placed = order.map((id, slot) => {
    const sprinting = id === sprinterId;
    // The sprinter runs from the back of the line to a gap ahead of the
    // leader, swinging out to the wide lane as they pass.
    const d = sprinting
      ? base - (RUNNERS - 1) * SPACING + (RUNNERS * SPACING) * p
      : base - slot * SPACING;
    const pt = onPerimeter(d);
    const out = sprinting ? LANE * Math.sin(Math.PI * p) : 0;
    return { id, x: pt.x + pt.nx * out, y: pt.y + pt.ny * out, sprinting };
  });

  const even = ROTATIONS * RUNNERS * BASE_SPRINT_S;
  const actual = ROTATIONS * ((RUNNERS - 1) * BASE_SPRINT_S + BASE_SPRINT_S * slow);
  const efficiency = even / actual;
  const lost = actual - even;
  const swapped = slow <= 1.001;

  const fade = (i: number) => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay: reduced ? 0 : 0.35 + i * 0.85, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-ink-2/50">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3 font-mono text-[10px] tracking-[0.28em] text-fg-dim">
        <span className="text-gold">A VISUALIZATION</span>
        <button
          type="button"
          onClick={() => setPaused((v) => !v)}
          className="rounded-full border border-line-2 px-3 py-1 tracking-[0.2em] text-paper/80 transition-colors hover:border-gold hover:text-gold"
        >
          {paused || reduced ? "PLAY" : "PAUSE"}
        </button>
      </div>

      {/* the hook, one line at a time */}
      <div className="space-y-3 border-b border-line px-5 py-8 md:px-8 md:py-10">
        {NARRATIVE.map((line, i) => (
          <motion.p
            key={line}
            {...fade(i)}
            className={
              i === NARRATIVE.length - 1
                ? "font-display text-2xl leading-snug tracking-tight text-gold-2 md:text-3xl"
                : "font-display text-2xl leading-snug tracking-tight text-paper md:text-3xl"
            }
          >
            {line}
          </motion.p>
        ))}
      </div>

      {/* the analogy */}
      <motion.div {...fade(NARRATIVE.length)} className="space-y-4 px-5 py-8 md:px-8">
        <p className="text-[16px] leading-relaxed text-fg-muted">
          Have you heard of an <span className="text-paper">Indian run</span>? At soccer practice the
          whole team runs laps around the pitch in a single-file line. The player at the very back
          sprints up the outside, passes everyone, and takes over the front. The moment they arrive,
          the new last player starts their sprint. The drill is done once everyone has led the line{" "}
          {ROTATIONS} times.
        </p>
        <p className="text-[16px] leading-relaxed text-fg-muted">
          Here is the catch: it is not over until the{" "}
          <span className="text-paper">slowest player</span> has finished all of their sprints. Five
          quick teammates change nothing. One who is gassed turns a six-minute drill into nine, and
          everybody else jogs and waits for a turn that cannot start early.
        </p>
      </motion.div>

      <svg
        viewBox="0 0 600 300"
        className="w-full"
        role="img"
        aria-label={`Six runners in single file circling a soccer pitch. Runner ${
          SLOW_ID + 1
        } sprints at ${slow.toFixed(1)} times the normal duration, stretching the drill from ${clock(
          even,
        )} to ${clock(actual)}.`}
      >
        {/* pitch */}
        <rect
          x={X1}
          y={Y1}
          width={W}
          height={H}
          fill="rgba(47,122,79,0.07)"
          stroke="var(--line-2)"
          strokeWidth="1.5"
        />
        <line x1={(X1 + X2) / 2} y1={Y1} x2={(X1 + X2) / 2} y2={Y2} stroke="var(--line-2)" strokeWidth="1" />
        <circle
          cx={(X1 + X2) / 2}
          cy={(Y1 + Y2) / 2}
          r="34"
          fill="none"
          stroke="var(--line-2)"
          strokeWidth="1"
        />
        <rect x={X1} y={(Y1 + Y2) / 2 - 42} width="34" height="84" fill="none" stroke="var(--line-2)" strokeWidth="1" />
        <rect x={X2 - 34} y={(Y1 + Y2) / 2 - 42} width="34" height="84" fill="none" stroke="var(--line-2)" strokeWidth="1" />

        {placed.map((r) => {
          const isSlow = r.id === SLOW_ID;
          const fill = isSlow && !swapped ? "var(--stamp-red)" : r.sprinting ? "var(--gold)" : "var(--ink-3)";
          const stroke = isSlow && !swapped ? "var(--stamp-red)" : "var(--line-2)";
          return (
            <g key={r.id}>
              <circle cx={r.x} cy={r.y} r={R} fill={fill} stroke={stroke} strokeWidth="1.5" />
              <text
                x={r.x}
                y={r.y + 4}
                textAnchor="middle"
                className="font-mono"
                fontSize="11"
                fill={(isSlow && !swapped) || r.sprinting ? "var(--ink)" : "var(--fg-muted)"}
              >
                {r.id + 1}
              </text>
              {isSlow && !swapped && (
                <text
                  x={r.x}
                  y={r.y - R - 8}
                  textAnchor="middle"
                  className="font-mono"
                  fontSize="8"
                  letterSpacing="2"
                  fill="var(--stamp-red)"
                >
                  SLOW
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="border-t border-line px-5 py-6 md:px-8">
        <label className="block">
          <span className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-[10px] tracking-[0.28em] text-fg-dim">
            <span>
              RUNNER {SLOW_ID + 1} SPRINTS AT{" "}
              <span className={swapped ? "text-gold-2" : "text-stamp-red"}>{slow.toFixed(1)}×</span>
            </span>
            <span>{swapped ? "EVERYONE KEEPS UP" : "ONE STRAGGLER"}</span>
          </span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.1}
            value={slow}
            onChange={(e) => setSlow(Number(e.target.value))}
            className={`mt-3 w-full ${swapped ? "accent-[var(--gold)]" : "accent-[var(--stamp-red)]"}`}
            aria-label="How much slower the straggler sprints"
          />
        </label>

        <dl className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-4">
          {[
            { k: "DRILL TIME", v: clock(actual), tone: swapped ? "text-gold-2" : "text-stamp-red" },
            { k: "IF ALL EVEN", v: clock(even), tone: "text-paper" },
            { k: "TIME LOST", v: clock(lost), tone: "text-paper" },
            { k: "TEAM RUNNING AT", v: `${Math.round(efficiency * 100)}%`, tone: "text-gold-2" },
          ].map((s) => (
            <div key={s.k}>
              <dd className={`font-display text-3xl leading-none tracking-tight ${s.tone}`}>{s.v}</dd>
              <dt className="mt-2 font-mono text-[9px] tracking-[0.24em] text-fg-dim">{s.k}</dt>
            </div>
          ))}
        </dl>
      </div>

      {/* the point */}
      <div className="space-y-4 border-t border-dashed border-line px-5 py-8 md:px-8">
        <p className="text-[16px] leading-relaxed text-fg-muted">
          A GPU cluster training a model runs the same drill. Every GPU works through its slice of
          the batch, then all of them stop at a barrier to exchange gradients, and{" "}
          <span className="text-paper">nobody starts the next step until the last one arrives</span>.
          One GPU running 30% slow makes every step 30% longer, and you pay for the rest of the
          cluster to sit there waiting.
        </p>
        <p className="text-[16px] leading-relaxed text-fg-muted">
          So what I am building figures out{" "}
          <span className="text-paper">which GPU keeps arriving last</span> while the job is still
          running. Once you know that, you pull it and swap in one that can keep up, instead of
          quietly paying the tax on every step for weeks.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            type="button"
            onClick={() => setSlow(swapped ? 2.8 : 1)}
            className={`rounded-full px-6 py-3 font-mono text-[11px] font-semibold tracking-[0.22em] transition-transform hover:-translate-y-0.5 ${
              swapped ? "border border-line-2 text-paper hover:border-gold" : "bg-gold text-ink"
            }`}
          >
            {swapped ? "PUT THE STRAGGLER BACK" : "SWAP IN A GPU THAT KEEPS UP →"}
          </button>
          <span className="font-mono text-[10px] tracking-[0.22em] text-fg-dim">
            {swapped ? "FULL SPEED · NOTHING WASTED" : `${Math.round((1 - efficiency) * 100)}% OF THE CLUSTER WASTED`}
          </span>
        </div>
      </div>
    </div>
  );
}
