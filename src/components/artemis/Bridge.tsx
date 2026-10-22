import { artemis } from "@/data/artemis";
import { Arrow, Container, Eyebrow, Tag, button } from "./bits";

const { bridge } = artemis;

const CHIP_W = 100;
const CHIP_H = 54;

function Chip({ x, y, label, leader, w = CHIP_W }: { x: number; y: number; label: string; leader?: boolean; w?: number }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={CHIP_H}
        rx="3"
        className={leader ? "fill-ar-fg/[0.08] stroke-ar-fg/70" : "fill-ar-fg/[0.025] stroke-ar-fg/25"}
      />
      <text x={x + 12} y={y + 22} className="ar-mono fill-ar-fg" fontSize="12">
        {label}
      </text>
      {leader && (
        <text x={x + 12} y={y + 40} className="ar-mono fill-ar-muted" fontSize="9" letterSpacing="0.08em">
          LEADER
        </text>
      )}
    </g>
  );
}

const ARIA =
  "Diagram: four NVIDIA GPUs, ranks 0 to 3, reduce on NCCL onto their leader, rank 0. Four AMD GPUs, ranks 4 to 7, reduce on RCCL onto their leader, rank 4. The two leaders exchange over GPUBridge's bridge, then each broadcasts the result back to its island.";

/** Two vendor islands side by side; each reduces on its own library, then the leaders talk over the bridge. */
function Wide() {
  return (
    <svg viewBox="0 0 720 300" className="hidden h-auto w-full md:block" role="img" aria-label={ARIA}>
      {[
        { x: 16, title: "NVIDIA  ·  NCCL" },
        { x: 434, title: "AMD  ·  RCCL" },
      ].map((island) => (
        <g key={island.title}>
          <rect x={island.x} y={28} width={270} height={244} rx="4" className="fill-none stroke-ar-fg/15" />
          <text x={island.x + 18} y={56} className="ar-mono fill-ar-muted" fontSize="10.5" letterSpacing="0.12em">
            {island.title}
          </text>
          <text x={island.x + 18} y={258} className="ar-mono fill-ar-faint" fontSize="9.5" letterSpacing="0.08em">
            1 REDUCE · 3 BROADCAST
          </text>
        </g>
      ))}

      <g className="stroke-ar-fg/35" strokeDasharray="3 4" fill="none">
        <path d="M144 107 H166" />
        <path d="M94 186 V170 Q94 150 130 150 H200 Q216 150 216 134" />
        <path d="M216 186 V134" />
        <path d="M554 107 H576" />
        <path d="M626 186 V170 Q626 150 590 150 H520 Q504 150 504 134" />
        <path d="M504 186 V134" />
      </g>

      <Chip x={44} y={80} label="r1" />
      <Chip x={166} y={80} label="r0" leader />
      <Chip x={44} y={186} label="r2" />
      <Chip x={166} y={186} label="r3" />
      <Chip x={454} y={80} label="r4" leader />
      <Chip x={576} y={80} label="r5" />
      <Chip x={454} y={186} label="r6" />
      <Chip x={576} y={186} label="r7" />

      <path d="M266 107 H454" className="stroke-ar-data/25" strokeWidth="7" fill="none" />
      <path d="M266 107 H454" className="ar-flow stroke-ar-data" strokeWidth="2" strokeDasharray="10 10" fill="none" />
      <circle cx="360" cy="107" r="13" className="fill-ar-bg stroke-ar-data" strokeWidth="1.5" />
      <text x="360" y="111" textAnchor="middle" className="ar-mono fill-ar-fg" fontSize="11">
        2
      </text>
      <text x="360" y="80" textAnchor="middle" className="ar-mono fill-ar-fg" fontSize="10" letterSpacing="0.14em">
        THE BRIDGE
      </text>
      <text x="360" y="140" textAnchor="middle" className="ar-mono fill-ar-faint" fontSize="9" letterSpacing="0.06em">
        GLOO · TCP BY DEFAULT
      </text>
      <text x="360" y="154" textAnchor="middle" className="ar-mono fill-ar-faint" fontSize="9" letterSpacing="0.06em">
        RUST VERBS, OPT-IN
      </text>
    </svg>
  );
}

/** The same, stacked for a phone: the bridge runs down the left edge. */
function Tall() {
  return (
    <svg viewBox="0 0 340 470" className="mx-auto h-auto w-full max-w-[400px] md:hidden" role="img" aria-label={ARIA}>
      {[
        { y: 16, title: "NVIDIA · NCCL" },
        { y: 262, title: "AMD · RCCL" },
      ].map((island) => (
        <g key={island.title}>
          <rect x={40} y={island.y} width={288} height={192} rx="4" className="fill-none stroke-ar-fg/15" />
          <text x={56} y={island.y + 178} className="ar-mono fill-ar-muted" fontSize="10.5" letterSpacing="0.1em">
            {island.title}
          </text>
        </g>
      ))}
      <g className="stroke-ar-fg/35" strokeDasharray="3 4" fill="none">
        <path d="M188 61 H170" />
        <path d="M115 98 V112" />
        <path d="M188 112 L170 98" />
        <path d="M188 307 H170" />
        <path d="M115 344 V358" />
        <path d="M188 358 L170 344" />
      </g>
      <Chip x={60} y={34} label="r0" leader w={110} />
      <Chip x={188} y={34} label="r1" w={110} />
      <Chip x={60} y={112} label="r2" w={110} />
      <Chip x={188} y={112} label="r3" w={110} />
      <Chip x={60} y={280} label="r4" leader w={110} />
      <Chip x={188} y={280} label="r5" w={110} />
      <Chip x={60} y={358} label="r6" w={110} />
      <Chip x={188} y={358} label="r7" w={110} />

      <path d="M60 61 H18 V307 H60" className="stroke-ar-data/25" strokeWidth="7" fill="none" />
      <path d="M60 61 H18 V307 H60" className="ar-flow stroke-ar-data" strokeWidth="2" strokeDasharray="10 10" fill="none" />
      <circle cx="18" cy="235" r="12" className="fill-ar-bg stroke-ar-data" strokeWidth="1.5" />
      <text x="18" y="239" textAnchor="middle" className="ar-mono fill-ar-fg" fontSize="11">
        2
      </text>
      <text x="44" y="232" className="ar-mono fill-ar-fg" fontSize="10" letterSpacing="0.12em">
        THE BRIDGE
      </text>
      <text x="44" y="246" className="ar-mono fill-ar-faint" fontSize="9" letterSpacing="0.04em">
        GLOO · TCP BY DEFAULT, RUST VERBS OPT-IN
      </text>
    </svg>
  );
}

export default function Bridge() {
  return (
    <section id="gpubridge" aria-labelledby="bridge-title" className="border-t border-ar-line bg-ar-panel/50 py-20 md:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="min-w-0 lg:col-span-5">
            <Eyebrow n="03">{bridge.eyebrow}</Eyebrow>
            <h2 id="bridge-title" className="ar-display mt-6 text-[clamp(2.1rem,4.2vw,3.5rem)] leading-[1.02] text-ar-fg">
              {bridge.heading}
            </h2>
            {bridge.body.map((p) => (
              <p key={p.slice(0, 24)} className="mt-6 text-[16.5px] leading-[1.65] text-ar-muted">
                {p}
              </p>
            ))}
            <figure className="mt-8 border border-ar-line-2 bg-ar-bg">
              <figcaption className="ar-label flex items-center justify-between border-b border-ar-line px-4 py-2.5 text-ar-faint">
                <span>train.py</span>
                <span>Python</span>
              </figcaption>
              <pre className="ar-mono overflow-x-auto px-4 py-4 text-[12.5px] leading-[1.9] text-ar-fg">
                <code>
                  {bridge.snippet.map((line) => (
                    <span key={line.code} className="block">
                      {line.code}
                      {"note" in line && <span className="text-ar-faint">{`  # ${line.note}`}</span>}
                    </span>
                  ))}
                </code>
              </pre>
            </figure>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={artemis.github} className={button.solid}>
                Read the code
                <Arrow className="transition-transform group-hover:translate-x-0.5" />
              </a>
              <a href={artemis.githubIssues} className={button.line}>
                Open an issue
              </a>
            </div>
          </div>

          <div className="min-w-0 lg:col-span-7 lg:pl-6">
            <figure className="border border-ar-line-2 bg-ar-bg p-4 md:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="ar-label text-ar-faint">One all-reduce</span>
                <Tag tone="data">Training payload</Tag>
              </div>
              <Wide />
              <Tall />
              <ol className="mt-4 grid gap-3 border-t border-ar-line pt-5 sm:grid-cols-3 sm:gap-4">
                {bridge.steps.map((s) => (
                  <li key={s.n} className="text-[14px] leading-snug text-ar-muted">
                    <span className="ar-mono mr-2 text-ar-fg">{s.n}</span>
                    <span className="font-semibold text-ar-fg">{s.title}</span> {s.body}
                  </li>
                ))}
              </ol>
            </figure>

            <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {bridge.features.map((f) => (
                <li key={f} className="flex gap-3 text-[15px] leading-snug text-ar-muted">
                  <span aria-hidden="true" className="mt-[9px] h-px w-3 shrink-0 bg-ar-data" />
                  {f}
                </li>
              ))}
            </ul>

            <ul className="mt-12 grid gap-8 sm:grid-cols-3">
              {bridge.stats.map((s) => (
                <li key={s.value} className="border-t border-ar-fg/40 pt-4">
                  <span className="ar-display block text-[clamp(2.3rem,3.8vw,3.2rem)] leading-none text-ar-fg">{s.value}</span>
                  <span className="mt-3 block text-[14px] leading-snug text-ar-muted">{s.label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-10 border-l-2 border-ar-data pl-4 text-[15px] leading-[1.65] text-ar-muted">{bridge.insight}</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
