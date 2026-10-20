import { artemis } from "@/data/artemis";
import { Arrow, Container, Eyebrow } from "./bits";

const { bridge } = artemis;

const CHIP_W = 100;
const CHIP_H = 54;

function Chip({ x, y, label, leader }: { x: number; y: number; label: string; leader?: boolean }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={CHIP_W}
        height={CHIP_H}
        rx="3"
        className={leader ? "fill-ar-night-fg/10 stroke-ar-night-fg/70" : "fill-ar-night-fg/[0.03] stroke-ar-night-fg/30"}
      />
      <text x={x + 12} y={y + 22} className="ar-mono fill-ar-night-fg" fontSize="12">
        {label}
      </text>
      {leader && (
        <text x={x + 12} y={y + 40} className="ar-mono fill-ar-night-faint" fontSize="9" letterSpacing="0.08em">
          LEADER
        </text>
      )}
    </g>
  );
}

/** Two vendor islands; each reduces on its own library, then the leaders talk over the bridge. */
function Diagram() {
  return (
    <svg
      viewBox="0 0 720 300"
      className="h-auto w-full"
      role="img"
      aria-label="Diagram: four NVIDIA GPUs reduce on NCCL to a leader, four AMD GPUs reduce on RCCL to a leader, and the two leaders exchange over GPUBridge before broadcasting back."
    >
      {[
        { x: 16, title: "NVIDIA  ·  NCCL" },
        { x: 434, title: "AMD  ·  RCCL" },
      ].map((island) => (
        <g key={island.title}>
          <rect x={island.x} y={28} width={270} height={244} rx="4" className="fill-none stroke-ar-night-fg/20" />
          <text x={island.x + 18} y={56} className="ar-mono fill-ar-night-muted" fontSize="10.5" letterSpacing="0.12em">
            {island.title}
          </text>
          <text x={island.x + 18} y={256} className="ar-mono fill-ar-night-faint" fontSize="9.5" letterSpacing="0.08em">
            1 REDUCE   ·   3 BROADCAST
          </text>
        </g>
      ))}

      {/* In-island links to each leader. */}
      <g className="stroke-ar-night-fg/35" strokeDasharray="3 4" fill="none">
        <path d="M144 107 H166" />
        <path d="M94 186 V170 Q94 150 130 150 H200 Q216 150 216 134" />
        <path d="M216 186 V134" />
        <path d="M554 107 H576" />
        <path d="M626 186 V170 Q626 150 590 150 H520 Q504 150 504 134" />
        <path d="M504 186 V134" />
      </g>

      <Chip x={44} y={80} label="r0" />
      <Chip x={166} y={80} label="r1" leader />
      <Chip x={44} y={186} label="r2" />
      <Chip x={166} y={186} label="r3" />
      <Chip x={454} y={80} label="r4" leader />
      <Chip x={576} y={80} label="r5" />
      <Chip x={454} y={186} label="r6" />
      <Chip x={576} y={186} label="r7" />

      {/* The bridge. */}
      <path d="M266 107 H454" className="stroke-ar-night-fg/25" strokeWidth="6" fill="none" />
      <path d="M266 107 H454" className="ar-flow stroke-ar-night-fg" strokeWidth="2" strokeDasharray="10 10" fill="none" />
      <circle cx="360" cy="107" r="13" className="fill-ar-night stroke-ar-night-fg" />
      <text x="360" y="111" textAnchor="middle" className="ar-mono fill-ar-night-fg" fontSize="11">
        2
      </text>
      <text x="360" y="80" textAnchor="middle" className="ar-mono fill-ar-night-fg" fontSize="10" letterSpacing="0.14em">
        GPUBRIDGE
      </text>
      <text x="360" y="140" textAnchor="middle" className="ar-mono fill-ar-night-faint" fontSize="9.5" letterSpacing="0.08em">
        FP8 · TCP TODAY
      </text>
    </svg>
  );
}

export default function Bridge() {
  return (
    <section id="gpubridge" aria-labelledby="bridge-title" className="bg-ar-night py-20 text-ar-night-fg md:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <Eyebrow n="03" className="text-ar-night-faint">
              {bridge.eyebrow}
            </Eyebrow>
            <h2 id="bridge-title" className="ar-display mt-6 text-[clamp(2.2rem,4.2vw,3.6rem)] leading-[0.98]">
              {bridge.heading}
            </h2>
            {bridge.body.map((p) => (
              <p key={p.slice(0, 24)} className="mt-6 text-[16.5px] leading-[1.65] text-ar-night-muted">
                {p}
              </p>
            ))}
            <pre className="ar-mono mt-8 overflow-x-auto border border-ar-night-line bg-ar-night-fg/[0.03] px-4 py-4 text-[12.5px] leading-[1.9]">
              <code>
                {bridge.snippet.map((line) => (
                  <span key={line.code} className="block">
                    {"note" in line && <span className="block text-ar-night-faint">{`# ${line.note}`}</span>}
                    {line.code}
                  </span>
                ))}
              </code>
            </pre>
            <a
              href={artemis.github}
              className="group mt-8 inline-flex h-12 items-center gap-2.5 rounded-full bg-ar-night-fg px-6 text-[15px] font-medium text-ar-night transition-opacity hover:opacity-85"
            >
              Read the code on GitHub
              <Arrow className="transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>

          <div className="lg:col-span-7 lg:pl-6">
            <div className="border border-ar-night-line p-4 md:p-6">
              <Diagram />
              <ol className="mt-4 grid gap-4 border-t border-ar-night-line pt-5 sm:grid-cols-3">
                {bridge.steps.map((s) => (
                  <li key={s.n} className="text-[14px] leading-snug text-ar-night-muted">
                    <span className="ar-mono mr-2 text-ar-night-fg">{s.n}</span>
                    <span className="font-semibold text-ar-night-fg">{s.title}</span> {s.body}
                  </li>
                ))}
              </ol>
            </div>
            <ul className="mt-10 grid gap-8 sm:grid-cols-3">
              {bridge.stats.map((s) => (
                <li key={s.value} className="border-t border-ar-night-fg/40 pt-4">
                  <span className="ar-display block text-[clamp(2.4rem,4vw,3.4rem)] leading-none">{s.value}</span>
                  <span className="mt-3 block text-[14px] leading-snug text-ar-night-muted">{s.label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-10 border-l-2 border-ar-night-fg/40 pl-4 text-[14.5px] leading-[1.65] text-ar-night-muted">
              {bridge.status}
            </p>
            <div className="mt-10 border border-ar-night-line">
              <ul className="grid divide-y divide-ar-night-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                {bridge.channels.map((c) => (
                  <li key={c.name} className="p-5">
                    <p className="ar-mono text-[10.5px] uppercase tracking-[0.12em] text-ar-night-faint">{c.owner}</p>
                    <p className="mt-2 text-[16px] font-semibold">{c.name}</p>
                    <p className="mt-1.5 text-[14px] leading-snug text-ar-night-muted">{c.body}</p>
                  </li>
                ))}
              </ul>
              <p className="border-t border-ar-night-line p-5 text-[14px] leading-[1.6] text-ar-night-muted">{bridge.channelsNote}</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
