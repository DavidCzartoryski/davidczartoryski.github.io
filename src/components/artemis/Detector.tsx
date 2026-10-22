import { artemis } from "@/data/artemis";
import { Container, SectionHead, Tag, Ticks } from "./bits";

const { detector } = artemis;
const { pipeline } = detector;

const CTL = { "--ar-wire": "var(--ar-ctl)" } as React.CSSProperties;

/** A short neutral connector between two stacked boxes. */
function Down() {
  return (
    <div aria-hidden="true" className="flex h-5 justify-center">
      <span className="w-px bg-ar-line-2" />
    </div>
  );
}

function Box({ name, body, accent }: { name: string; body: string; accent?: "ctl" | "dashed" }) {
  const edge = accent === "ctl" ? "border-ar-ctl/60" : accent === "dashed" ? "border-dashed border-ar-line-2" : "border-ar-line-2";
  return (
    <div className={`border bg-ar-bg px-4 py-3 ${edge}`}>
      <p className="ar-mono text-[12px] font-medium text-ar-fg">{name}</p>
      <p className="mt-1 text-[13.5px] leading-snug text-ar-muted">{body}</p>
    </div>
  );
}

/** The detector's own channel between the node agent and the coordinator. */
function Channel() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-5 lg:px-1 lg:py-0">
      <Tag tone="ctl">{pipeline.channel.via}</Tag>
      {/* Across on wide screens, down on narrow ones. */}
      <div className="hidden w-full flex-col gap-3 lg:flex" aria-hidden="true">
        <div>
          <div className="ar-wire" style={CTL} />
          <p className="ar-mono mt-1 text-center text-[10px] text-ar-faint">{pipeline.channel.up} →</p>
        </div>
        <div>
          <div className="ar-wire ar-wire-back" style={CTL} />
          <p className="ar-mono mt-1 text-center text-[10px] text-ar-faint">← {pipeline.channel.down}</p>
        </div>
      </div>
      <div className="flex h-16 items-stretch gap-6 lg:hidden" aria-hidden="true">
        <div className="flex items-stretch gap-2">
          <div className="ar-wire ar-wire-v" style={CTL} />
          <p className="ar-mono self-center text-[10px] text-ar-faint">{pipeline.channel.up} ↓</p>
        </div>
        <div className="flex items-stretch gap-2">
          <div className="ar-wire ar-wire-v ar-wire-back" style={CTL} />
          <p className="ar-mono self-center text-[10px] text-ar-faint">↑ {pipeline.channel.down}</p>
        </div>
      </div>
      <p className="sr-only">
        The node agent sends window summaries to the coordinator, and the coordinator sends control messages and
        acknowledgements back, over the detector&apos;s own Rust channel on libibverbs.
      </p>
    </div>
  );
}

function Architecture() {
  return (
    <figure className="relative border border-ar-line-2 bg-ar-panel p-4 md:p-6">
      <Ticks />
      <figcaption className="ar-label mb-5 flex flex-wrap items-center justify-between gap-3 text-ar-faint">
        <span>Architecture · native path</span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="h-0.5 w-5 bg-ar-ctl" />
          Detector channel
        </span>
      </figcaption>
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(150px,2fr)_minmax(0,4fr)_minmax(0,3fr)] lg:gap-0">
        <div className="border border-ar-line p-3 md:p-4">
          <p className="ar-label mb-3 text-ar-faint">{pipeline.node.title}</p>
          {pipeline.node.items.map((item, i) => (
            <div key={item.name}>
              {i > 0 && <Down />}
              <Box name={item.name} body={item.body} accent={i === pipeline.node.items.length - 1 ? "ctl" : undefined} />
            </div>
          ))}
        </div>
        <Channel />
        <div className="border border-ar-line p-3 md:p-4">
          <p className="ar-label mb-3 text-ar-faint">{pipeline.coordinator.title}</p>
          {pipeline.coordinator.items.map((item, i) => (
            <div key={item.name}>
              {i > 0 && <Down />}
              <Box
                name={item.name}
                body={item.body}
                accent={i === 0 ? "ctl" : i === pipeline.coordinator.items.length - 1 ? "dashed" : undefined}
              />
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-center py-5 lg:py-0 lg:pl-5">
          <div aria-hidden="true" className="mb-3 flex justify-center lg:hidden">
            <span className="h-6 w-px bg-ar-line-2" />
          </div>
          <p className="ar-label mb-3 text-ar-faint">{pipeline.outputs.title}</p>
          <ul className="space-y-2">
            {pipeline.outputs.items.map((o) => (
              <li key={o} className="ar-mono flex items-center gap-3 border border-ar-line px-3 py-2.5 text-[12px] text-ar-fg">
                <span aria-hidden="true" className="text-ar-faint">→</span>
                {o}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-5 border-t border-ar-line pt-4 text-[13.5px] leading-snug text-ar-faint">{pipeline.alt}</p>
    </figure>
  );
}

export default function Detector() {
  return (
    <section id="detector" aria-labelledby="detector-title" className="border-t border-ar-line bg-ar-panel/50 py-20 md:py-28">
      <Container>
        <SectionHead
          id="detector-title"
          n="05"
          eyebrow={detector.eyebrow}
          title={detector.heading}
          lede={detector.body}
          aside={
            <div className="mt-5">
              <Tag tone="dashed">{detector.source}</Tag>
            </div>
          }
        />

        <div className="mt-14">
          <Architecture />
        </div>

        <ol className="mt-12 grid gap-px border border-ar-line bg-ar-line md:grid-cols-2 xl:grid-cols-4">
          {detector.stages.map((s) => (
            <li key={s.n} className="flex flex-col bg-ar-bg p-6 md:p-7">
              <div className="flex h-7 items-center justify-between">
                <span className="ar-mono text-[11px] text-ar-faint">{s.n}</span>
                {"tag" in s ? <Tag tone="dashed">{s.tag}</Tag> : <span aria-hidden="true" className="h-px w-10 bg-ar-line-2" />}
              </div>
              <h3 className="ar-display mt-8 text-[26px] leading-none text-ar-fg">{s.title}</h3>
              <p className="mt-4 text-[15px] leading-[1.6] text-ar-muted">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-16 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h3 className="ar-display text-[clamp(1.4rem,2.2vw,1.8rem)] leading-tight text-ar-fg">Every rebalancing plan</h3>
            <ol className="mt-6 grid grid-cols-2 gap-px border border-ar-line bg-ar-line md:grid-cols-4">
              {detector.chain.map((c, i) => (
                <li key={c} className="flex min-h-[84px] flex-col justify-between gap-3 bg-ar-bg p-4">
                  <span className="ar-mono text-[10.5px] text-ar-faint">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[14.5px] font-medium leading-snug text-ar-fg">{c}</span>
                </li>
              ))}
              <li className="flex min-h-[84px] flex-col justify-between gap-3 bg-ar-fg p-4 text-ar-bg">
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M13 8a5 5 0 1 1-1.6-3.7M13 2.5v2.8h-2.8" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <span className="text-[14.5px] font-medium leading-snug">{detector.chainEnd}</span>
              </li>
            </ol>
            <p className="mt-6 border-l-2 border-ar-ctl pl-4 text-[15.5px] leading-[1.6] text-ar-fg">{detector.never}</p>
          </div>
          <div className="lg:col-span-5">
            <h3 className="ar-display text-[clamp(1.4rem,2.2vw,1.8rem)] leading-tight text-ar-fg">Attach without editing the script</h3>
            <figure className="mt-6 border border-ar-line-2 bg-ar-bg">
              <figcaption className="ar-label flex items-center justify-between border-b border-ar-line px-4 py-2.5 text-ar-faint">
                <span>Shell</span>
                <span>Launch as usual</span>
              </figcaption>
              <pre className="ar-mono whitespace-pre-wrap break-words px-4 py-4 text-[12.5px] leading-relaxed text-ar-fg">
                <code>
                  <span className="select-none text-ar-faint">$ </span>
                  {detector.attach}
                </code>
              </pre>
            </figure>
            <p className="mt-4 text-[14px] leading-snug text-ar-faint">{detector.attachNote}</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
