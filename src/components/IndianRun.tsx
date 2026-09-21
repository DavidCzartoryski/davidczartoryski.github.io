"use client";

import { useEffect, useState } from "react";

/**
 * Interactive explainer for the straggler problem, told as an Indian run:
 * the team rotates one sprinter at a time, so the drill only finishes as fast
 * as its slowest runner. Drag the slider to slow one runner down and watch the
 * whole drill stretch.
 */

const RUNNERS = 6;
/** Which runner is the straggler. */
const SLOW_ID = 3;
/** Times each runner has to reach the front before the drill ends. */
const ROTATIONS = 3;
/** Drill-clock seconds one healthy sprint costs. */
const BASE_SPRINT_S = 20;
/** On-screen milliseconds one healthy sprint takes. */
const HEALTHY_MS = 820;

const GAP = 96;
const X0 = 54;
const TRACK_Y = 118;
const LANE_LIFT = 54;
const R = 15;

const slotX = (slot: number) => X0 + (RUNNERS - 1 - slot) * GAP;

function clock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

type Sim = { order: number[]; p: number };

export default function IndianRun() {
  const [slow, setSlow] = useState(2.2);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  const [sim, setSim] = useState<Sim>({ order: [0, 1, 2, 3, 4, 5], p: 0 });

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
        const p = s.p + dt / duration;
        // Sprint finished: the sprinter takes the front, everyone slides back.
        if (p >= 1) return { order: [sprinter, ...s.order.slice(0, RUNNERS - 1)], p: 0 };
        return { order: s.order, p };
      });

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [paused, reduced, slow]);

  const { order, p } = sim;
  const sprinterId = order[RUNNERS - 1];

  // Slot 0 is the front of the line. The sprinter runs up the outside lane to
  // the front; everyone else slides back exactly one slot.
  const placed = order.map((id, slot) => {
    if (id === sprinterId) {
      return {
        id,
        x: slotX(RUNNERS - 1) + (slotX(0) - slotX(RUNNERS - 1)) * p,
        y: TRACK_Y - LANE_LIFT * Math.sin(Math.PI * p),
        sprinting: true,
      };
    }
    return {
      id,
      x: slotX(slot) + (slotX(slot + 1) - slotX(slot)) * p,
      y: TRACK_Y,
      sprinting: false,
    };
  });

  const even = ROTATIONS * RUNNERS * BASE_SPRINT_S;
  const actual = ROTATIONS * ((RUNNERS - 1) * BASE_SPRINT_S + BASE_SPRINT_S * slow);
  const efficiency = even / actual;
  const lost = actual - even;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-ink-2/50">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3 font-mono text-[10px] tracking-[0.28em] text-fg-dim">
        <span className="text-gold">THE INDIAN RUN</span>
        <button
          type="button"
          onClick={() => setPaused((v) => !v)}
          className="rounded-full border border-line-2 px-3 py-1 tracking-[0.2em] text-paper/80 transition-colors hover:border-gold hover:text-gold"
        >
          {paused || reduced ? "PLAY" : "PAUSE"}
        </button>
      </div>

      <svg
        viewBox="0 24 600 146"
        className="w-full"
        role="img"
        aria-label={`A line of six runners rotating one at a time. Runner ${
          SLOW_ID + 1
        } sprints at ${slow.toFixed(1)} times the normal duration, stretching the drill from ${clock(
          even,
        )} to ${clock(actual)}.`}
      >
        <line
          x1="20"
          y1={TRACK_Y + R + 12}
          x2="580"
          y2={TRACK_Y + R + 12}
          stroke="var(--line-2)"
          strokeWidth="1"
          strokeDasharray="5 7"
        />
        <text
          x="580"
          y={TRACK_Y + R + 30}
          textAnchor="end"
          className="font-mono"
          fontSize="9"
          letterSpacing="2.5"
          fill="var(--fg-dim)"
        >
          FRONT
        </text>

        {placed.map((r) => {
          const isSlow = r.id === SLOW_ID;
          const fill = isSlow ? "var(--stamp-red)" : r.sprinting ? "var(--gold)" : "var(--ink-3)";
          const stroke = isSlow ? "var(--stamp-red)" : "var(--line-2)";
          return (
            <g key={r.id}>
              {r.sprinting && (
                <line
                  x1={r.x - 26}
                  y1={r.y}
                  x2={r.x - 8}
                  y2={r.y}
                  stroke={isSlow ? "var(--stamp-red)" : "var(--gold)"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.5"
                />
              )}
              <circle cx={r.x} cy={r.y} r={R} fill={fill} stroke={stroke} strokeWidth="1.5" />
              <text
                x={r.x}
                y={r.y + 4}
                textAnchor="middle"
                className="font-mono"
                fontSize="11"
                fill={isSlow || r.sprinting ? "var(--ink)" : "var(--fg-muted)"}
              >
                {r.id + 1}
              </text>
              {isSlow && (
                <text
                  x={r.x}
                  y={r.y - R - 9}
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

      <div className="border-t border-line px-5 py-5">
        <label className="block">
          <span className="flex items-baseline justify-between font-mono text-[10px] tracking-[0.28em] text-fg-dim">
            <span>
              RUNNER {SLOW_ID + 1} SPRINTS AT <span className="text-stamp-red">{slow.toFixed(1)}×</span>
            </span>
            <span>{slow === 1 ? "EVERYONE EVEN" : "ONE STRAGGLER"}</span>
          </span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.1}
            value={slow}
            onChange={(e) => setSlow(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--stamp-red)]"
            aria-label="How much slower the straggler sprints"
          />
        </label>

        <dl className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-4">
          {[
            { k: "DRILL TIME", v: clock(actual), tone: "text-stamp-red" },
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

        <p className="mt-6 border-t border-dashed border-line pt-5 text-[14px] leading-relaxed text-fg-muted">
          Five runners are in great shape. It does not matter. The drill is only over once{" "}
          <span className="text-paper">runner {SLOW_ID + 1}</span> has finished all {ROTATIONS} of their
          sprints, so everyone else jogs and waits.{" "}
          <span className="text-paper">
            Swap runners for GPUs and this is a training step: the cluster is running at{" "}
            {Math.round(efficiency * 100)}% of the hardware you are paying for.
          </span>
        </p>
      </div>
    </div>
  );
}
