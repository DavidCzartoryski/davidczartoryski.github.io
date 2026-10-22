"use client";

import { useEffect, useId, useRef, useState } from "react";
import { artemis } from "@/data/artemis";

const { outputs } = artemis.detector.pipeline;
type OutputId = (typeof outputs.items)[number]["id"];

/**
 * One simulated job behind every sample: rank 2, on the NVIDIA island, slows
 * from window 35 and is flagged at 37 (3 suspect windows out of the last 4),
 * with the same numbers as the hero's finding. Real field and metric names.
 */
const SLOW = 2;
const ONSET = 35;
const FLAGGED = 37;
const FIRST = 20;
const LAST = 52;
const STEPS = 50;
const THRESHOLD = 1.1;

/** One line of findings.jsonl: the Report fields, in the order the detector writes them. */
const RECORD = {
  kind: "rank",
  state: "flagged",
  window: FLAGGED,
  steps: [FLAGGED * STEPS, (FLAGGED + 1) * STEPS],
  island: "nvidia",
  rank: SLOW,
  ranks: [SLOW],
  hosts: ["node-a"],
  since: ONSET,
  ratio: 1.19,
  z: 14.2,
  history: 1.18,
  drift: null,
  excess_ms: 8.1,
  loss_pct: 7.6,
  confidence: "peers",
  signal: "gap",
  basis: "peers",
  missing: [],
  evidence: null,
  cause: {
    kind: "clocks",
    text: "clocks low (SM 1110 MHz vs 1530 MHz on its peers), no throttle reason: locked clocks or a misconfigured GPU",
    evidence: {
      sm_mhz: 1110,
      peers_sm_mhz: 1530,
      temp_c: 61,
      peers_temp_c: 63,
      power_frac: 0.48,
      throttle: {},
      pcie_degraded: 0.0,
    },
  },
};

/** Values the eye should land on: the state and what the regression costs. */
const HOT = new Set(["state", "excess_ms", "loss_pct"]);
/** Python floats, which json writes with a decimal point even when whole. */
const FLOATS = new Set(["ratio", "z", "history", "excess_ms", "loss_pct", "power_frac", "pcie_degraded"]);

type Json = string | number | null | Json[] | { [key: string]: Json };

function scalar(v: Json, key: string | null): React.ReactNode {
  const tone = key !== null && HOT.has(key) ? "text-ar-signal-ink" : "text-ar-fg";
  if (v === null) return <span className="text-ar-muted">null</span>;
  if (typeof v === "string") return <span className={tone}>&quot;{v}&quot;</span>;
  if (typeof v === "number")
    return <span className={tone}>{key !== null && FLOATS.has(key) && Number.isInteger(v) ? v.toFixed(1) : String(v)}</span>;
  if (Array.isArray(v))
    return (
      <span className="text-ar-fg">
        [
        {v.map((x, i) => (
          <span key={i}>
            {i > 0 && ", "}
            {scalar(x, null)}
          </span>
        ))}
        ]
      </span>
    );
  return <span className="text-ar-fg">{"{}"}</span>;
}

/** Pretty-printed JSON, one block per line, with a hanging indent where a long value wraps. */
function lines(key: string | null, v: Json, depth: number, last: boolean): { depth: number; node: React.ReactNode }[] {
  const comma = last ? "" : ",";
  const label = key === null ? null : <span className="text-ar-faint">&quot;{key}&quot;: </span>;
  if (v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length) {
    const entries = Object.entries(v);
    return [
      { depth, node: <>{label}{"{"}</> },
      ...entries.flatMap(([k, x], i) => lines(k, x, depth + 1, i === entries.length - 1)),
      { depth, node: <>{"}"}{comma}</> },
    ];
  }
  return [{ depth, node: <>{label}{scalar(v, key)}{comma}</> }];
}

function JsonlSample() {
  return (
    <pre className="ar-mono max-h-[440px] overflow-y-auto border border-ar-line bg-ar-bg p-4 text-[12px] leading-[1.75] text-ar-faint">
      <code>
        {lines(null, RECORD as Json, 0, true).map((l, i) => (
          <span key={i} className="block whitespace-pre-wrap break-words" style={{ paddingLeft: `${l.depth * 2 + 2}ch`, textIndent: "-2ch" }}>
            {l.node}
          </span>
        ))}
      </code>
    </pre>
  );
}

function B({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-ar-fg">{children}</strong>;
}

function C({ children }: { children: React.ReactNode }) {
  return <code className="ar-mono rounded-sm bg-ar-fg/[0.06] px-1 text-[12px] text-ar-fg">{children}</code>;
}

/** What `straggler-report` writes for the same run, rendered as Markdown would be. */
function IncidentSample() {
  return (
    <article className="border border-ar-line bg-ar-bg p-5 text-[14px] leading-relaxed text-ar-muted md:p-6">
      <h4 className="text-[19px] font-semibold text-ar-fg">Straggler incident report</h4>
      <p className="mt-2">
        From <C>findings.jsonl</C>. Reports cover windows {FLAGGED} to {LAST} (steps {FLAGGED * STEPS} to {(LAST + 1) * STEPS}).
      </p>
      <h5 className="mt-5 text-[15.5px] font-semibold text-ar-fg">Summary</h5>
      <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-ar-faint">
        <li>Incidents: straggler rank (1).</li>
        <li>Still flagged at the end: 1 (rank 2, a rank).</li>
        <li>Hosts named: node-a (1).</li>
      </ul>
      <h5 className="mt-5 text-[15.5px] font-semibold text-ar-fg">Incidents</h5>
      <h6 className="mt-3 text-[14.5px] font-semibold text-ar-fg">1. Straggler rank: rank 2</h6>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 marker:text-ar-faint">
        <li>
          <B>When:</B> suspect from window {ONSET}, flagged at window {FLAGGED} (steps {FLAGGED * STEPS} to {(FLAGGED + 1) * STEPS}),
          still flagged at the last report (window {LAST}); {LAST - ONSET + 1} window(s).
        </li>
        <li>
          <B>Where:</B> ranks 2; hosts node-a; island nvidia.
        </li>
        <li>
          <B>At worst:</B> 1.21x its island&apos;s pace, z 15.8, <span className="text-ar-signal-ink">+8.9 ms/step, 8.3% of step time</span>.
        </li>
        <li>
          <B>Confidence:</B> peers ({LAST - FLAGGED + 1} window(s)).
        </li>
        <li>
          <B>Likely cause:</B> clocks low (SM 1110 MHz vs 1530 MHz on its peers), no throttle reason: locked clocks or a
          misconfigured GPU (clocks).
        </li>
      </ul>
    </article>
  );
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** What the exporter would have served each window: every rank's pace over its island, and the step time. */
const SERIES = (() => {
  const rand = mulberry32(37);
  const jitter = () => rand() - 0.5;
  return Array.from({ length: LAST - FIRST + 1 }, (_, i) => {
    const w = FIRST + i;
    const after = w >= ONSET;
    const pace = Array.from({ length: 8 }, (_, r) =>
      r === SLOW && after ? (w === FLAGGED ? 1.19 : 1.19 + jitter() * 0.024) : 1 + jitter() * 0.024,
    );
    const step = w === FLAGGED ? 106.6 : (after ? 106.6 : 98.5) + jitter() * 1.1;
    const others = pace.filter((_, r) => r !== SLOW).sort((a, b) => a - b);
    return { w, pace, step, peers: others[3] };
  });
})();

/** Wall clock for a window, about 5.3 s each, as Grafana's time axis would show it. */
const START = Date.UTC(2026, 9, 21, 14, 2, 0);
const SECONDS = 5.3;
const at = (w: number) => START + (w - FIRST) * SECONDS * 1000;
const clock = (ms: number, seconds = false) =>
  new Date(ms).toISOString().slice(11, seconds ? 19 : 16);

function PaceChart() {
  const wrap = useRef<HTMLDivElement>(null);
  const [measured, setWidth] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const width = measured ?? 560;

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ml = 36;
  const mr = 52;
  const top = 10;
  const h = width < 420 ? 150 : 180;
  const height = top + h + 24;
  const plotW = Math.max(120, width - ml - mr);
  const DOMAIN = [0.94, 1.24];
  const x = (w: number) => ml + ((w - FIRST) / (LAST - FIRST)) * plotW;
  const y = (v: number) => top + (1 - (v - DOMAIN[0]) / (DOMAIN[1] - DOMAIN[0])) * h;
  const path = (r: number) => SERIES.map((d, i) => `${i ? "L" : "M"}${x(d.w).toFixed(1)} ${y(d.pace[r]).toFixed(1)}`).join("");
  const minutes = [0, 1, 2].map((m) => START + m * 60_000).filter((t) => t <= at(LAST));
  const end = SERIES[SERIES.length - 1];
  const hw = hover === null ? null : SERIES[hover - FIRST];

  function windowAt(clientX: number) {
    const box = wrap.current?.getBoundingClientRect();
    if (!box) return null;
    const w = Math.round(FIRST + ((clientX - box.left - ml) / plotW) * (LAST - FIRST));
    return Math.min(LAST, Math.max(FIRST, w));
  }

  function onKey(e: React.KeyboardEvent) {
    const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    if (e.key in moves) {
      e.preventDefault();
      setHover((v) => Math.min(LAST, Math.max(FIRST, (v ?? FLAGGED - 1) + moves[e.key])));
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      setHover(e.key === "Home" ? FIRST : LAST);
    } else if (e.key === "Escape") setHover(null);
  }

  return (
    <div>
      <div
        ref={wrap}
        tabIndex={0}
        role="group"
        aria-label="Rank pace over its island, windows 20 to 52. Use the arrow keys to read each window."
        className="relative w-full touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-ar-fg/60"
        onPointerMove={(e) => setHover(windowAt(e.clientX))}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onKey}
        onBlur={() => setHover(null)}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={measured ?? undefined}
          height={measured ? height : undefined}
          className="block h-auto w-full"
          aria-hidden="true"
        >
          {[1, 1.1, 1.2].map((v) => (
            <g key={v}>
              <line x1={ml} x2={ml + plotW} y1={y(v)} y2={y(v)} className={v === THRESHOLD ? "stroke-ar-fg/35" : "stroke-ar-fg/10"} strokeDasharray={v === THRESHOLD ? "4 4" : undefined} />
              <text x={ml - 8} y={y(v) + 3.5} textAnchor="end" className="ar-mono fill-ar-faint" fontSize="10">
                {v.toFixed(2)}
              </text>
            </g>
          ))}
          <text x={ml + 6} y={y(THRESHOLD) - 6} className="ar-mono fill-ar-faint" fontSize="10">
            suspect above 1.10
          </text>
          {[0, 1, 3, 4, 5, 6, 7].map((r) => (
            <path key={r} d={path(r)} fill="none" className="stroke-ar-fg/25" strokeWidth="1.25" strokeLinejoin="round" />
          ))}
          <path d={path(SLOW)} fill="none" className="stroke-ar-signal" strokeWidth="2" strokeLinejoin="round" />
          <circle cx={x(FLAGGED)} cy={y(1.19)} r="4.5" className="fill-ar-signal stroke-ar-panel" strokeWidth="2" />
          <text x={x(FLAGGED)} y={y(1.19) - 11} textAnchor="middle" className="ar-mono fill-ar-fg" fontSize="10">
            flagged
          </text>
          <text x={ml + plotW + 8} y={y(end.pace[SLOW]) + 3.5} className="ar-mono fill-ar-fg" fontSize="10.5">
            rank 2
          </text>
          <text x={ml + plotW + 8} y={y(1) + 3.5} className="ar-mono fill-ar-faint" fontSize="10.5">
            peers
          </text>
          <line x1={ml} x2={ml + plotW} y1={top + h} y2={top + h} className="stroke-ar-fg/20" />
          {minutes.map((t) => {
            const px = ml + ((t - START) / (at(LAST) - START)) * plotW;
            return (
              <text key={t} x={px} y={top + h + 16} textAnchor={px === ml ? "start" : "middle"} className="ar-mono fill-ar-faint" fontSize="10">
                {clock(t)}
              </text>
            );
          })}
          {hw && (
            <g>
              <line x1={x(hw.w)} x2={x(hw.w)} y1={top} y2={top + h} className="stroke-ar-fg/50" />
              <circle cx={x(hw.w)} cy={y(hw.pace[SLOW])} r="4" className="fill-ar-signal stroke-ar-panel" strokeWidth="2" />
            </g>
          )}
        </svg>
        {hw && (
          <div
            className="ar-mono pointer-events-none absolute top-0 z-10 w-[176px] border border-ar-line-2 bg-ar-bg/95 p-3 text-[11px] leading-relaxed text-ar-fg shadow-xl backdrop-blur"
            style={hw.w > (FIRST + LAST) / 2 ? { left: Math.max(0, x(hw.w) - 188) } : { left: Math.min(width - 176, x(hw.w) + 12) }}
          >
            <p className="text-ar-faint">
              {clock(at(hw.w), true)} · window {hw.w}
            </p>
            <dl className="mt-1.5 grid grid-cols-[1fr_auto] gap-x-3">
              <dt className="text-ar-muted">Rank 2</dt>
              <dd className="text-right">{hw.pace[SLOW].toFixed(2)}</dd>
              <dt className="text-ar-muted">Peer median</dt>
              <dd className="text-right">{hw.peers.toFixed(2)}</dd>
            </dl>
          </div>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {hw ? `Window ${hw.w}: rank 2 ${hw.pace[SLOW].toFixed(2)}, peer median ${hw.peers.toFixed(2)}.` : ""}
      </p>
    </div>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`border border-ar-line bg-ar-bg p-3 ${className}`}>
      <p className="ar-mono text-[11.5px] text-ar-muted">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

/** The exporter's text format, as Prometheus would scrape it at the last window. */
const EXPOSITION = [
  ["# TYPE straggler_rank_pace_ratio gauge", "comment"],
  ['straggler_rank_pace_ratio{rank="0",island="nvidia"} 1.0', ""],
  ['straggler_rank_pace_ratio{rank="2",island="nvidia"} 1.19', "hot"],
  ["...", "comment"],
  ["# TYPE straggler_flagged gauge", "comment"],
  ['straggler_flagged{kind="rank",subject="2"} 1.0', "hot"],
  ["# TYPE straggler_step_ms gauge", "comment"],
  ["straggler_step_ms 106.6", ""],
  ["# TYPE straggler_findings_total counter", "comment"],
  ['straggler_findings_total{kind="rank",state="flagged"} 1.0', ""],
  ['straggler_findings_total{kind="rank",state="ongoing"} 15.0', ""],
  ["straggler_missing_ranks 0.0", ""],
  ["straggler_detector_active 1.0", ""],
] as const;

function MetricsSample() {
  const steps = SERIES.map((d) => d.step);
  const lo = Math.min(...steps) - 1;
  const hi = Math.max(...steps) + 1;
  const spark = SERIES.map((d, i) => `${i ? "L" : "M"}${i} ${(((hi - d.step) / (hi - lo)) * 40).toFixed(2)}`).join("");
  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="grid grid-cols-3 gap-3">
        {[
          ["Last window", String(LAST)],
          ["Ranks missing", "0"],
          ["Detector active", "1"],
        ].map(([k, v]) => (
          <Panel key={k} title={k}>
            <p className="ar-display text-[28px] leading-none text-ar-fg">{v}</p>
          </Panel>
        ))}
      </div>
      <Panel title="Rank pace over its island">
        <ul className="ar-mono mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] uppercase tracking-[0.08em] text-ar-muted">
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-ar-signal" />
            Rank 2
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-ar-fg/30" />
            The other 7
          </li>
        </ul>
        <PaceChart />
      </Panel>
      <div className="grid gap-3 sm:grid-cols-2">
        <Panel title="Flagged now">
          <table className="ar-mono w-full text-left text-[11.5px] tabular-nums">
            <thead className="text-ar-faint">
              <tr>
                <th scope="col" className="pb-1.5 font-normal">kind</th>
                <th scope="col" className="pb-1.5 font-normal">subject</th>
                <th scope="col" className="pb-1.5 text-right font-normal">value</th>
              </tr>
            </thead>
            <tbody className="text-ar-fg">
              <tr className="border-t border-ar-line">
                <td className="py-1.5">rank</td>
                <td className="py-1.5">2</td>
                <td className="py-1.5 text-right">1</td>
              </tr>
            </tbody>
          </table>
        </Panel>
        <Panel title="Median step time">
          <p className="ar-mono text-[11.5px] text-ar-muted">
            {steps[0].toFixed(1)} ms <span aria-hidden="true">→</span> <span className="text-ar-fg">{steps[steps.length - 1].toFixed(1)} ms</span>
          </p>
          <svg viewBox={`0 0 ${SERIES.length - 1} 40`} preserveAspectRatio="none" className="mt-2 block h-10 w-full" aria-hidden="true">
            <path d={spark} fill="none" className="stroke-ar-fg/70" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </svg>
        </Panel>
      </div>
      <div className="min-w-0">
        <p className="ar-mono mb-2 text-[11.5px] text-ar-muted">What Prometheus scrapes, at window {LAST}</p>
        <Exposition />
      </div>
    </div>
  );
}

function Exposition() {
  return (
    <pre className="ar-mono overflow-x-auto border border-ar-line bg-ar-bg p-4 text-[11.5px] leading-[1.8]">
      <code>
        {EXPOSITION.map(([line, tone], i) => (
          <span key={i} className={`block whitespace-pre ${tone === "comment" ? "text-ar-faint" : tone === "hot" ? "text-ar-signal-ink" : "text-ar-fg"}`}>
            {line}
          </span>
        ))}
      </code>
    </pre>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true" className={`shrink-0 text-ar-faint transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
      <path d="M3.5 6l4.5 4.5L12.5 6" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

const SAMPLES: Record<OutputId, () => React.ReactNode> = {
  jsonl: () => <JsonlSample />,
  incident: () => <IncidentSample />,
  metrics: () => <MetricsSample />,
};

/**
 * The architecture's "Out" column, each output a button that drops a sample of
 * it open underneath the diagram: a JSONL line, an incident report, and the
 * metrics with a mock of the Grafana dashboard. Two grid items, so the sample
 * can span the whole architecture row.
 */
export default function Outputs() {
  const uid = useId().replace(/[^\w-]/g, "");
  const [open, setOpen] = useState<OutputId | null>(null);
  // Keeps the last sample's content in place while the drawer closes.
  const [shown, setShown] = useState<OutputId>("jsonl");

  function toggle(id: OutputId) {
    setShown(id);
    setOpen((o) => (o === id ? null : id));
  }

  return (
    <>
      <div className="flex flex-col justify-center py-5 lg:py-0 lg:pl-5">
        <div aria-hidden="true" className="mb-3 flex justify-center lg:hidden">
          <span className="h-6 w-px bg-ar-line-2" />
        </div>
        <p className="ar-label mb-3 text-ar-faint">{outputs.title}</p>
        <ul className="space-y-2">
          {outputs.items.map((o) => {
            const isOpen = open === o.id;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  id={`${uid}-${o.id}-button`}
                  aria-expanded={isOpen}
                  aria-controls={`${uid}-${o.id}`}
                  onClick={() => toggle(o.id)}
                  className={`ar-mono flex w-full items-center gap-3 border px-3 py-2.5 text-left text-[12px] text-ar-fg transition-colors ${
                    isOpen ? "border-ar-ctl/70 bg-ar-ctl/10" : "border-ar-line hover:border-ar-fg/40"
                  }`}
                >
                  <span aria-hidden="true" className={isOpen ? "text-ar-ctl-ink" : "text-ar-faint"}>
                    →
                  </span>
                  <span className="flex-1">{o.name}</span>
                  <Chevron open={isOpen} />
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[12.5px] leading-snug text-ar-faint">{outputs.hint}</p>
      </div>

      <div
        className={`grid min-w-0 grid-cols-1 transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none lg:col-span-full ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          {outputs.items.map((o) => (
            <div
              key={o.id}
              id={`${uid}-${o.id}`}
              role="region"
              aria-labelledby={`${uid}-${o.id}-button`}
              hidden={shown !== o.id}
              inert={open !== o.id}
              className="pt-5"
            >
              <div className="grid grid-cols-1 gap-5 border border-ar-ctl/40 bg-ar-panel p-4 md:p-6 lg:grid-cols-12 lg:gap-8">
                <div className="min-w-0 lg:col-span-4">
                  <p className="ar-label text-ar-ctl-ink">{o.name}</p>
                  <p className="mt-3 text-[15px] leading-[1.6] text-ar-muted">{o.lead}</p>
                  <code className="ar-mono mt-4 block break-words border-l-2 border-ar-ctl/60 pl-3 text-[12px] leading-relaxed text-ar-fg">
                    {o.command.split(/(?<=[(=.])/).map((part, i) => (
                      <span key={i}>
                        {i > 0 && <wbr />}
                        {part}
                      </span>
                    ))}
                  </code>
                  <p className="mt-4 text-[12.5px] leading-relaxed text-ar-faint">
                    {o.caption} {outputs.sample}
                  </p>
                </div>
                <div className="min-w-0 lg:col-span-8">{SAMPLES[o.id]()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
