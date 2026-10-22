"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { artemis } from "@/data/artemis";
import { Tag } from "./bits";

const { collectives } = artemis.bridge;
type OpId = (typeof collectives.ops)[number]["id"];

type Pt = [number, number];
type Box = { x: number; y: number; w: number; h: number };

/** What a rank's chip shows: a value, a row of cells, or nothing because it sits this one out. */
type Held = { text: string; sub?: string; dim?: boolean } | { cells: number[] } | { idle: true };
/** One hop. Island hops are straight lines; the bridge joins the leaders; the link joins r3 and r6. */
type Move = { from: number; to: number; route?: "bridge" | "link"; delay?: number };
type Phase = {
  moves: Move[];
  /** The ranks this step changes, and what they hold after it. */
  set: Record<number, Held>;
  /** When each rank's change lands, in ms; by default when its last packet arrives. */
  at?: number[];
  /** A line under each island while the step runs. */
  notes: [string, string];
};
type Mechanics = { start: Held[]; phases: Phase[]; world?: boolean };

/** How long a packet takes over one hop, and how long a finished step stays up while playing. */
const TRAVEL = 900;
const SETTLE = 1000;

const RANKS = [0, 1, 2, 3, 4, 5, 6, 7];
const NV = [0, 1, 2, 3];
const AMD = [4, 5, 6, 7];
/** Each island's leader is its lowest global rank. */
const LEADERS = [0, 4];
const DASH: Held = { text: "–", dim: true };

const on = (ranks: number[], held: Held | ((r: number) => Held)) =>
  Object.fromEntries(ranks.map((r) => [r, typeof held === "function" ? held(r) : held]));
const strip = (level: (i: number) => number): Held => ({ cells: RANKS.map(level) });
const into = (leader: number, island: number[]) => island.filter((r) => r !== leader).map((r) => ({ from: r, to: leader }));
const outOf = (src: number, island: number[]) => island.filter((r) => r !== src).map((r) => ({ from: src, to: r }));

const TO_LEADERS = [...into(0, NV), ...into(4, AMD)];
const FROM_LEADERS = [...outOf(0, NV), ...outOf(4, AMD)];
const EXCHANGE: Move[] = [
  { from: 0, to: 4, route: "bridge" },
  { from: 4, to: 0, route: "bridge" },
];
const TO_HOST: [string, string] = ["r0 COPIES TO HOST", "r4 COPIES TO HOST"];

/** Each rank's gradient in the all_reduce, small enough to add up by eye. */
const GRAD = [3, 1, 4, 1, 5, 9, 2, 6];
const sum = (ranks: number[]) => String(ranks.reduce((s, r) => s + GRAD[r], 0));

/** The route every operation takes through GPUBridge's default policy, step by step. */
const MECHANICS: Record<OpId, Mechanics> = {
  all_reduce: {
    start: RANKS.map((r) => ({ text: String(GRAD[r]) })),
    phases: [
      {
        moves: TO_LEADERS,
        set: { ...on([1, 2, 3, 5, 6, 7], DASH), 0: { text: sum(NV), sub: "sum of 4" }, 4: { text: sum(AMD), sub: "sum of 4" } },
        notes: ["REDUCE ONTO r0 · NCCL", "REDUCE ONTO r4 · RCCL"],
      },
      { moves: EXCHANGE, set: on(LEADERS, { text: sum(RANKS), sub: "sum of 8" }), notes: TO_HOST },
      {
        moves: FROM_LEADERS,
        set: on([1, 2, 3, 5, 6, 7], { text: sum(RANKS), sub: "sum of 8" }),
        notes: ["BROADCAST FROM r0 · NCCL", "BROADCAST FROM r4 · RCCL"],
      },
    ],
  },
  broadcast: {
    start: RANKS.map((r) => (r === 2 ? { text: "w" } : DASH)),
    phases: [
      { moves: outOf(2, NV), set: on([0, 1, 3], { text: "w" }), notes: ["BROADCAST FROM r2 · NCCL", ""] },
      { moves: [{ from: 0, to: 4, route: "bridge" }], set: { 4: { text: "w" } }, notes: ["r0 COPIES TO HOST", "r4 COPIES TO GPU"] },
      { moves: outOf(4, AMD), set: on([5, 6, 7], { text: "w" }), notes: ["", "BROADCAST FROM r4 · RCCL"] },
    ],
  },
  all_gather: {
    start: RANKS.map((r) => strip((i) => (i === r ? 3 : 0))),
    phases: [
      {
        moves: TO_LEADERS,
        set: { 0: strip((i) => (i < 4 ? 3 : 0)), 4: strip((i) => (i >= 4 ? 3 : 0)) },
        notes: ["GATHER ONTO r0 · NCCL", "GATHER ONTO r4 · RCCL"],
      },
      {
        // One leader at a time: r0 sends its island's shards, then r4 sends its own.
        moves: [EXCHANGE[0], { ...EXCHANGE[1], delay: TRAVEL }],
        set: on(LEADERS, strip(() => 3)),
        notes: ["r0 SENDS, THEN RECEIVES", "r4 RECEIVES, THEN SENDS"],
      },
      {
        moves: FROM_LEADERS,
        set: on([1, 2, 3, 5, 6, 7], strip(() => 3)),
        notes: ["BROADCAST FROM r0 · NCCL", "BROADCAST FROM r4 · RCCL"],
      },
    ],
  },
  reduce_scatter: {
    start: RANKS.map(() => strip(() => 1)),
    phases: [
      { moves: TO_LEADERS, set: on(LEADERS, strip(() => 2)), notes: ["REDUCE ONTO r0 · NCCL", "REDUCE ONTO r4 · RCCL"] },
      { moves: EXCHANGE, set: on(LEADERS, strip(() => 3)), notes: TO_HOST },
      {
        moves: FROM_LEADERS,
        set: on(RANKS, (r) => strip((i) => (i === r ? 3 : 0))),
        notes: ["SCATTER FROM r0 · NCCL", "SCATTER FROM r4 · RCCL"],
      },
    ],
  },
  send_recv: {
    start: RANKS.map((r) => (r === 2 ? { text: "act" } : r === 3 || r === 6 ? DASH : { idle: true })),
    phases: [
      { moves: [{ from: 2, to: 3 }], set: { 3: { text: "act" } }, notes: ["r2 TO r3 · NCCL", ""] },
      { moves: [{ from: 3, to: 6, route: "link" }], set: { 6: { text: "act" } }, notes: ["r3 COPIES TO HOST", "r6 COPIES TO GPU"] },
    ],
  },
  barrier: {
    world: true,
    start: RANKS.map(() => ({ text: "working" })),
    phases: [
      {
        moves: [],
        set: on(RANKS, { text: "waiting", dim: true }),
        // Ranks finish their GPU work at different times; r2 is last.
        at: [500, 800, 1700, 650, 900, 550, 1050, 700],
        notes: ["SYNC GPU, THEN CHECK IN", "SYNC GPU, THEN CHECK IN"],
      },
      {
        moves: [],
        set: on(RANKS, { text: "released" }),
        at: RANKS.map(() => 250),
        notes: ["ALL 8 LEAVE TOGETHER", "ALL 8 LEAVE TOGETHER"],
      },
    ],
  },
};

function landsAt(phase: Phase, r: number) {
  if (phase.at) return phase.at[r];
  const hops = phase.moves.filter((m) => m.to === r).map((m) => (m.delay ?? 0) + TRAVEL);
  return hops.length ? Math.max(...hops) : TRAVEL;
}

function holdFor(phase: Phase) {
  return Math.max(TRAVEL, ...Object.keys(phase.set).map((r) => landsAt(phase, Number(r)))) + SETTLE;
}

/** Every rank's chip at `landed` ms into step `phase`, and whether this step just changed it. */
function heldBy(mech: Mechanics, phase: number, landed: number) {
  return mech.start.map((start, r) => {
    let held = start;
    for (let p = 0; p < phase; p++) held = mech.phases[p].set[r] ?? held;
    const next = phase >= 0 ? mech.phases[phase].set[r] : undefined;
    const lands = next !== undefined && landed >= landsAt(mech.phases[phase], r);
    return { held: lands ? next : held, hot: lands };
  });
}

type Layout = {
  name: string;
  w: number;
  h: number;
  chip: { w: number; h: number };
  /** Top-left corner of each rank's chip, by rank. */
  pos: Pt[];
  cell: { w: number; gap: number };
  font: { rank: number; value: number; sub: number; tag: number; title: number; note: number };
  islands: { box: Box; title: string; x: number; ty: number; ny: number }[];
  bridge: Pt[];
  bridgeLabels: { text: string; x: number; y: number; size: number; strong?: boolean }[];
  anchor: "start" | "middle";
  link: Pt[];
  linkLabel: Pt;
  world: Box;
  worldLabel: Pt;
};

/** Two islands side by side, leaders facing each other across the bridge. */
const WIDE: Layout = {
  name: "wide",
  w: 760,
  h: 312,
  chip: { w: 102, h: 60 },
  pos: [
    [180, 76],
    [40, 76],
    [40, 184],
    [180, 184],
    [478, 76],
    [618, 76],
    [478, 184],
    [618, 184],
  ],
  cell: { w: 7.5, gap: 2 },
  font: { rank: 14, value: 13.5, sub: 10, tag: 9.5, title: 12, note: 10.5 },
  islands: [
    { box: { x: 16, y: 30, w: 290, h: 266 }, title: "NVIDIA · NCCL", x: 40, ty: 58, ny: 278 },
    { box: { x: 454, y: 30, w: 290, h: 266 }, title: "AMD · RCCL", x: 478, ty: 58, ny: 278 },
  ],
  bridge: [
    [284, 106],
    [476, 106],
  ],
  bridgeLabels: [
    { text: "THE BRIDGE", x: 380, y: 90, size: 12, strong: true },
    { text: "DEFAULT: GLOO/TCP", x: 380, y: 134, size: 11 },
    { text: "OPT-IN: RUST VERBS", x: 380, y: 150, size: 11 },
  ],
  anchor: "middle",
  link: [
    [284, 214],
    [476, 214],
  ],
  linkLabel: [380, 204],
  world: { x: 5, y: 6, w: 750, h: 300 },
  worldLabel: [380, 21],
};

/** The same, stacked for a phone: the bridge runs down the left edge, the link down the middle. */
const TALL: Layout = {
  name: "tall",
  w: 340,
  h: 478,
  chip: { w: 116, h: 56 },
  pos: [
    [60, 46],
    [192, 46],
    [60, 114],
    [192, 114],
    [60, 290],
    [192, 290],
    [60, 358],
    [192, 358],
  ],
  cell: { w: 9, gap: 2.5 },
  font: { rank: 14, value: 13.5, sub: 10.5, tag: 10, title: 11, note: 10.5 },
  islands: [
    { box: { x: 40, y: 16, w: 288, h: 192 }, title: "NVIDIA · NCCL", x: 60, ty: 36, ny: 194 },
    { box: { x: 40, y: 260, w: 288, h: 192 }, title: "AMD · RCCL", x: 60, ty: 280, ny: 438 },
  ],
  bridge: [
    [58, 74],
    [22, 74],
    [22, 318],
    [58, 318],
  ],
  bridgeLabels: [
    { text: "THE BRIDGE", x: 34, y: 230, size: 10.5, strong: true },
    { text: "GLOO/TCP · VERBS OPT-IN", x: 34, y: 245, size: 9.5 },
  ],
  anchor: "start",
  link: [
    [250, 172],
    [250, 236],
    [184, 236],
    [184, 386],
    [178, 386],
  ],
  linkLabel: [192, 252],
  world: { x: 4, y: 4, w: 332, h: 466 },
  worldLabel: [170, 465],
};

const LEVELS = [0, 0.32, 0.62, 1];

const rect = (b: Box) => ({ x: b.x, y: b.y, width: b.w, height: b.h });
const toD = (pts: Pt[]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");

/** Where the line from a box's center toward `to` leaves the box, `pad` beyond its edge. */
function edge(b: Box, to: Pt, pad: number): Pt {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const dx = to[0] - cx;
  const dy = to[1] - cy;
  const s = Math.min(dx ? (b.w / 2 + pad) / Math.abs(dx) : Infinity, dy ? (b.h / 2 + pad) / Math.abs(dy) : Infinity);
  return [cx + dx * s, cy + dy * s];
}

function hop(L: Layout, m: Move): Pt[] {
  if (m.route === "bridge") return m.from === 0 ? L.bridge : [...L.bridge].reverse();
  if (m.route === "link") return L.link;
  const box = (r: number): Box => ({ x: L.pos[r][0], y: L.pos[r][1], ...L.chip });
  const mid = (b: Box): Pt => [b.x + b.w / 2, b.y + b.h / 2];
  const a = box(m.from);
  const b = box(m.to);
  return [edge(a, mid(b), 2), edge(b, mid(a), 3)];
}

/** Shift an axis-aligned polyline `d` units to the left of its direction, so two-way traffic doesn't overlap. */
function shift(pts: Pt[], d: number): Pt[] {
  return pts.map(([x, y], i) => {
    const seen = new Set<string>();
    const sides = [i > 0 && [pts[i - 1], pts[i]], i < pts.length - 1 && [pts[i], pts[i + 1]]];
    for (const side of sides) {
      if (!side) continue;
      const [a, b] = side;
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const nx = (b[1] - a[1]) / len;
      const ny = -(b[0] - a[0]) / len;
      const key = `${Math.round(nx)},${Math.round(ny)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      x += nx * d;
      y += ny * d;
    }
    return [x, y];
  });
}

const REDUCE = "(prefers-reduced-motion: reduce)";
function subscribe(onChange: () => void) {
  const query = window.matchMedia(REDUCE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
function useReducedMotion() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(REDUCE).matches, () => false);
}

/** A packet riding one hop, started by hand so each step replays from the beginning. */
function Packet({ d, delay }: { d: string; delay: number }) {
  const motion = useRef<SVGAnimationElement>(null);
  const fade = useRef<SVGAnimationElement>(null);
  useEffect(() => {
    motion.current?.beginElementAt(delay / 1000);
    fade.current?.beginElementAt(delay / 1000);
  }, [delay]);
  return (
    <g opacity="0">
      <circle r="7" className="fill-ar-data/40" />
      <circle r="3.5" className="fill-ar-fg" />
      <animateMotion ref={motion} path={d} dur={`${TRAVEL}ms`} begin="indefinite" fill="freeze" />
      <animate
        ref={fade}
        attributeName="opacity"
        values="0;1;1;0"
        keyTimes="0;0.12;0.86;1"
        dur={`${TRAVEL}ms`}
        begin="indefinite"
        fill="freeze"
      />
    </g>
  );
}

function Chip({ L, r, held, hot, tone }: { L: Layout; r: number; held: Held; hot: boolean; tone: "data" | "fg" }) {
  const [x, y] = L.pos[r];
  const { w, h } = L.chip;
  const leader = LEADERS.includes(r);
  const frame = hot
    ? tone === "fg"
      ? "fill-ar-fg/[0.1] stroke-ar-fg"
      : "fill-ar-data/[0.12] stroke-ar-data"
    : leader
      ? "fill-ar-fg/[0.08] stroke-ar-fg/70"
      : "fill-ar-fg/[0.025] stroke-ar-fg/25";
  return (
    <g opacity={"idle" in held ? 0.3 : 1} className="transition-opacity duration-300">
      <rect x={x} y={y} width={w} height={h} rx="3" className={`transition-colors duration-300 ${frame}`} />
      <text x={x + 12} y={y + h / 2 - 8} className="ar-mono fill-ar-fg" fontSize={L.font.rank}>
        {`r${r}`}
      </text>
      {leader && (
        <text
          x={x + w - 10}
          y={y + h / 2 - 8}
          textAnchor="end"
          className="ar-mono fill-ar-muted"
          fontSize={L.font.tag}
          letterSpacing="0.06em"
        >
          LEADER
        </text>
      )}
      {"text" in held && (
        <text x={x + 12} y={y + h / 2 + 16} className="ar-mono" fontSize={L.font.value}>
          <tspan className={held.dim ? "fill-ar-faint" : "fill-ar-fg"}>{held.text}</tspan>
          {held.sub && (
            <tspan dx="6" fontSize={L.font.sub} className="fill-ar-faint">
              {held.sub}
            </tspan>
          )}
        </text>
      )}
      {"cells" in held &&
        held.cells.map((level, i) => (
          <rect
            key={i}
            x={x + 12 + i * (L.cell.w + L.cell.gap)}
            y={y + h / 2 + 6}
            width={L.cell.w}
            height="10"
            rx="1"
            className={level ? "fill-ar-data" : "fill-none stroke-ar-fg/30"}
            fillOpacity={level ? LEVELS[level] : undefined}
          />
        ))}
    </g>
  );
}

function Diagram({
  L,
  uid,
  id,
  view,
  landed,
  reduced,
  className,
}: {
  L: Layout;
  uid: string;
  id: OpId;
  view: { phase: number; run: number };
  landed: number;
  reduced: boolean;
  className: string;
}) {
  const mech = MECHANICS[id];
  const phase = view.phase >= 0 ? mech.phases[view.phase] : undefined;
  const marker = `${uid}-${L.name}-arrow`;
  const uses = (route: Move["route"]) => mech.phases.some((p) => p.moves.some((m) => m.route === route));

  // Every island hop the operation takes, drawn faintly so the whole route shows before it plays.
  const routes = new Map<string, Pt[]>();
  for (const p of mech.phases)
    for (const m of p.moves) {
      const key = `${Math.min(m.from, m.to)}-${Math.max(m.from, m.to)}`;
      if (!m.route && !routes.has(key)) routes.set(key, hop(L, m));
    }

  const active = (phase?.moves ?? []).map((m) => {
    const twoWay = phase!.moves.some((o) => o.route === m.route && o.from === m.to && o.to === m.from);
    return { m, d: toD(twoWay ? shift(hop(L, m), 3) : hop(L, m)) };
  });

  const label = `${collectives.ops.find((o) => o.id === id)?.label} across an NVIDIA island, ranks 0 to 3, and an AMD island, ranks 4 to 7. Ranks 0 and 4 lead their islands and share the bridge.`;

  return (
    <svg viewBox={`0 0 ${L.w} ${L.h}`} className={`h-auto w-full ${className}`} role="img" aria-label={label}>
      <defs>
        <marker
          id={marker}
          viewBox="0 0 10 10"
          refX="8.5"
          refY="5"
          markerWidth="9"
          markerHeight="9"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path d="M0 1L9 5L0 9z" className="fill-ar-data" />
        </marker>
      </defs>

      {mech.world && (
        <g>
          <rect
            {...rect(L.world)}
            rx="6"
            fill="none"
            strokeDasharray="4 6"
            className={`transition-colors duration-300 ${phase ? "ar-flow stroke-ar-fg/70" : "stroke-ar-fg/30"}`}
          />
          <text
            x={L.worldLabel[0]}
            y={L.worldLabel[1]}
            textAnchor="middle"
            className={`ar-mono ${phase ? "fill-ar-fg" : "fill-ar-muted"}`}
            fontSize="10"
            letterSpacing="0.1em"
          >
            GLOO GROUP · ALL 8 RANKS
          </text>
        </g>
      )}

      {L.islands.map((island, i) => (
        <g key={island.title}>
          <rect {...rect(island.box)} rx="4" className="fill-none stroke-ar-fg/15" />
          <text x={island.x} y={island.ty} className="ar-mono fill-ar-muted" fontSize={L.font.title} letterSpacing="0.12em">
            {island.title}
          </text>
          {phase?.notes[i] && (
            <text x={island.x} y={island.ny} className="ar-mono fill-ar-fg" fontSize={L.font.note} letterSpacing="0.06em">
              {phase.notes[i]}
            </text>
          )}
        </g>
      ))}

      <g opacity={uses("bridge") ? 1 : 0.35} className="transition-opacity duration-300">
        <path d={toD(L.bridge)} className="stroke-ar-data/25" strokeWidth="7" fill="none" />
        {L.bridgeLabels.map((t) => (
          <text
            key={t.text}
            x={t.x}
            y={t.y}
            textAnchor={L.anchor}
            className={`ar-mono ${t.strong ? "fill-ar-fg" : "fill-ar-muted"}`}
            fontSize={t.size}
            letterSpacing={t.strong ? "0.12em" : "0.02em"}
          >
            {t.text}
          </text>
        ))}
      </g>

      {uses("link") && (
        <g>
          <path d={toD(L.link)} className="stroke-ar-fg/30" strokeWidth="1.5" strokeDasharray="3 4" fill="none" />
          <text
            x={L.linkLabel[0]}
            y={L.linkLabel[1]}
            textAnchor={L.anchor}
            className="ar-mono fill-ar-muted"
            fontSize={L.bridgeLabels[1].size}
            letterSpacing="0.02em"
          >
            P2P · GLOO LINK
          </text>
        </g>
      )}

      <g className="stroke-ar-fg/20" strokeDasharray="3 4" fill="none">
        {[...routes].map(([key, pts]) => (
          <path key={key} d={toD(pts)} />
        ))}
      </g>

      {active.map(({ m, d }) => (
        <g key={`${view.run}-${m.from}-${m.to}`} fill="none">
          <path d={d} className="stroke-ar-data/25" strokeWidth="6" strokeLinecap="round" />
          <path d={d} className="ar-flow stroke-ar-data" strokeWidth="2" strokeDasharray="10 10" markerEnd={`url(#${marker})`} />
        </g>
      ))}

      {heldBy(mech, view.phase, landed).map(({ held, hot }, r) => (
        <Chip key={r} L={L} r={r} held={held} hot={hot} tone={mech.world ? "fg" : "data"} />
      ))}

      {!reduced && active.map(({ m, d }) => <Packet key={`${view.run}-${m.from}-${m.to}`} d={d} delay={m.delay ?? 0} />)}
    </svg>
  );
}

/**
 * GPUBridge's collectives, one at a time: pick an operation and watch its route through
 * two vendor islands, hop by hop, with what every rank holds after each step.
 */
export default function Collectives() {
  const uid = useId().replace(/[^\w-]/g, "");
  const reduced = useReducedMotion();
  const [view, setView] = useState({ op: 0, phase: -1, run: 0 });
  const [landed, setLanded] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [touched, setTouched] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const handled = useRef(false);

  const op = collectives.ops[view.op];
  const mech = MECHANICS[op.id];
  const last = mech.phases.length - 1;

  function go(opIndex: number, phase: number, play: boolean) {
    stage.current?.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
    handled.current = true;
    setTouched(true);
    setView((v) => ({ op: opIndex, phase, run: v.run + 1 }));
    setLanded(-1);
    setPlaying(play);
  }

  // Land each rank's change when its packet arrives.
  useEffect(() => {
    if (view.phase < 0 || reduced) return;
    const phase = MECHANICS[collectives.ops[view.op].id].phases[view.phase];
    const times = new Set(Object.keys(phase.set).map((r) => landsAt(phase, Number(r))));
    const timers = [...times].map((t) => setTimeout(() => setLanded((l) => Math.max(l, t)), t));
    return () => timers.forEach(clearTimeout);
  }, [view, reduced]);

  // While playing, move to the next step once this one has settled.
  useEffect(() => {
    if (!playing) return;
    const phases = MECHANICS[collectives.ops[view.op].id].phases;
    const timer = setTimeout(
      () => {
        if (view.phase < phases.length - 1) {
          setView((v) => ({ ...v, phase: v.phase + 1, run: v.run + 1 }));
          setLanded(-1);
        } else setPlaying(false);
      },
      view.phase < 0 ? 0 : holdFor(phases[view.phase]),
    );
    return () => clearTimeout(timer);
  }, [playing, view]);

  // Play the all_reduce once when the diagram first comes into view, unless motion is reduced.
  useEffect(() => {
    const el = stage.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const watch = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        watch.disconnect();
        if (!handled.current && !window.matchMedia(REDUCE).matches) setPlaying(true);
      },
      { threshold: 0.45 },
    );
    watch.observe(el);
    return () => watch.disconnect();
  }, []);

  function toggle() {
    if (playing) {
      handled.current = true;
      setPlaying(false);
    } else if (view.phase >= last) go(view.op, 0, true);
    else if (view.phase < 0) {
      handled.current = true;
      setTouched(true);
      setPlaying(true);
    } else go(view.op, view.phase + 1, true);
  }

  function onTabKey(e: React.KeyboardEvent<HTMLButtonElement>) {
    const n = collectives.ops.length;
    const next = { ArrowRight: view.op + 1, ArrowLeft: view.op - 1, Home: 0, End: n - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const i = (next + n) % n;
    go(i, 0, true);
    (e.currentTarget.parentElement?.children[i] as HTMLElement | undefined)?.focus();
  }

  const step = view.phase >= 0 ? op.steps[view.phase] : undefined;
  const status = playing ? "Pause" : view.phase >= last ? "Replay" : "Play";

  return (
    <figure className="border border-ar-line-2 bg-ar-bg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ar-line px-4 py-2.5 md:px-6">
        <span className="ar-label text-ar-faint">{collectives.label}</span>
        <button
          type="button"
          onClick={toggle}
          aria-controls={`${uid}-panel`}
          className="inline-flex h-8 items-center gap-2 rounded-full bg-ar-fg px-3.5 text-[13px] font-semibold text-ar-bg transition-opacity hover:opacity-85"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
            {status === "Pause" ? (
              <path d="M4 3h3v10H4zM9 3h3v10H9z" fill="currentColor" />
            ) : status === "Replay" ? (
              <path d="M3 8a5 5 0 1 0 1.6-3.7M3 2.5v2.8h2.8" fill="none" stroke="currentColor" strokeWidth="1.8" />
            ) : (
              <path d="M4.5 2.5v11l9-5.5z" fill="currentColor" />
            )}
          </svg>
          {status}
        </button>
      </div>

      <div role="tablist" aria-label="Operations" className="flex flex-wrap gap-2 border-b border-ar-line px-4 py-3 md:px-6">
        {collectives.ops.map((o, i) => {
          const selected = i === view.op;
          return (
            <button
              key={o.id}
              type="button"
              role="tab"
              id={`${uid}-tab-${i}`}
              aria-selected={selected}
              aria-controls={`${uid}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => go(i, 0, true)}
              onKeyDown={onTabKey}
              className={`ar-mono inline-flex h-8 items-center rounded-full border px-3 text-[12px] transition-colors ${
                selected
                  ? "border-ar-fg/80 bg-ar-fg/[0.08] text-ar-fg"
                  : "border-ar-line-2 text-ar-muted hover:border-ar-fg/50 hover:text-ar-fg"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-tab-${view.op}`} className="grid xl:grid-cols-12">
        <div ref={stage} className="scroll-mt-32 p-4 md:p-6 xl:col-span-8 xl:flex xl:flex-col xl:justify-center">
          {[WIDE, TALL].map((L) => (
            <Diagram
              key={L.name}
              L={L}
              uid={uid}
              id={op.id}
              view={view}
              landed={reduced ? Infinity : landed}
              reduced={reduced}
              className={L === WIDE ? "mx-auto hidden max-w-[820px] md:block" : "mx-auto max-w-[400px] md:hidden"}
            />
          ))}
        </div>

        <div className="border-t border-ar-line p-4 md:p-6 xl:col-span-4 xl:border-l xl:border-t-0">
          <code className="ar-mono block text-[13px] leading-relaxed text-ar-fg">
            {op.call.split(" · ").map((call) => (
              <span key={call} className="block break-words">
                {call}
              </span>
            ))}
          </code>
          <p className="mt-2 text-[15px] leading-snug text-ar-muted">{op.result}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {op.id === "barrier" ? (
              <Tag tone="dashed">Synchronization</Tag>
            ) : (
              <Tag tone="data">Training payload</Tag>
            )}
            {op.id === "send_recv" && <Tag tone="dashed">Experimental</Tag>}
          </div>

          <ol className={`mt-6 grid gap-4 ${op.steps.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"} xl:grid-cols-1 xl:gap-1`}>
            {op.steps.map((s, i) => {
              const now = i === view.phase;
              const done = i < view.phase;
              return (
                <li key={`${op.id}-${i}`}>
                  <button
                    type="button"
                    onClick={() => go(view.op, i, false)}
                    aria-current={now ? "step" : undefined}
                    className={`w-full border-t-2 pt-3 text-left transition-colors xl:border-l-2 xl:border-t-0 xl:py-2.5 xl:pl-4 ${
                      now ? "border-ar-data" : done ? "border-ar-fg/40" : "border-ar-line-2 hover:border-ar-fg/40"
                    }`}
                  >
                    <span className={`ar-label flex gap-2.5 ${now ? "text-ar-fg" : "text-ar-faint"}`}>
                      <span className={now || done ? "text-ar-fg" : ""}>{String(i + 1).padStart(2, "0")}</span>
                      {s.title}
                    </span>
                    <span className="mt-1.5 block text-[14px] leading-snug text-ar-muted">{s.body}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-5 text-[13px] leading-relaxed text-ar-faint">{op.legend}</p>
        </div>
      </div>

      <p className="border-t border-ar-line px-4 py-3 text-[13px] leading-relaxed text-ar-faint md:px-6">
        {collectives.singleVendor}
      </p>
      <p className="sr-only" aria-live="polite">
        {touched && step ? `${op.label}, step ${view.phase + 1} of ${last + 1}: ${step.title}. ${step.body}` : ""}
      </p>
    </figure>
  );
}
