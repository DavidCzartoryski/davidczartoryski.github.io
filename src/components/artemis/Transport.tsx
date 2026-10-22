import { artemis } from "@/data/artemis";
import { Container, SectionHead, Tag, Ticks } from "./bits";

const { transport } = artemis;

type Channel = (typeof transport.channels)[number];

const WIRE = {
  data: { "--ar-wire": "var(--ar-data)" },
  ctl: { "--ar-wire": "var(--ar-ctl)" },
} as Record<Channel["key"], React.CSSProperties>;

function Endpoint({ children }: { children: React.ReactNode }) {
  return (
    <span className="ar-mono w-[82px] shrink-0 rounded-[3px] border border-ar-line-2 bg-ar-bg px-1 py-2 text-center text-[10.5px] leading-tight text-ar-fg xl:w-auto xl:px-3 xl:text-[11.5px]">
      {children}
    </span>
  );
}

/** Two endpoints and the wire between them. Training data flows both ways; telemetry goes up and control comes back. */
function Wires({ channel }: { channel: Channel }) {
  const wires =
    channel.key === "data"
      ? [{ label: "payloads ⇄", back: false }]
      : [
          { label: "summaries", back: false },
          { label: "control, acks", back: true },
        ];
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <Endpoint>{channel.from}</Endpoint>
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        {wires.map((w) => (
          <div key={w.label}>
            <div className={`ar-wire ${w.back ? "ar-wire-back" : ""}`} style={WIRE[channel.key]} />
            <p className="ar-mono mt-1 truncate text-center text-[10px] text-ar-faint">
              {w.back ? "← " : ""}
              {w.label}
              {w.back || channel.key === "data" ? "" : " →"}
            </p>
          </div>
        ))}
      </div>
      <Endpoint>{channel.to}</Endpoint>
    </div>
  );
}

export default function Transport() {
  return (
    <section id="transport" aria-labelledby="transport-title" className="border-t border-ar-line py-20 md:py-28">
      <Container>
        <SectionHead id="transport-title" n="04" eyebrow={transport.eyebrow} title={transport.heading} lede={transport.body} />

        <ul className="mt-14 grid gap-6 md:grid-cols-2">
          {transport.channels.map((c) => (
            <li key={c.key} className="relative flex min-w-0 flex-col border border-ar-line-2 bg-ar-panel">
              <Ticks />
              <div className={`h-[3px] ${c.key === "data" ? "bg-ar-data" : "bg-ar-ctl"}`} aria-hidden="true" />
              <div className="flex flex-1 flex-col p-6 md:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="ar-display text-[24px] leading-tight text-ar-fg">{c.name}</h3>
                  <Tag tone={c.key}>{c.owner}</Tag>
                </div>
                <div className="mt-6">
                  <Wires channel={c} />
                  <p className="sr-only">
                    {c.from} to {c.to}.
                  </p>
                </div>
                <p className="mt-6 text-[15.5px] leading-[1.6] text-ar-fg">{c.carries}</p>
                <dl className="mt-5 border-t border-ar-line">
                  {c.how.map(([k, v]) => (
                    <div key={k} className="grid gap-1 border-b border-ar-line py-3 sm:grid-cols-[92px_1fr] sm:gap-4">
                      <dt className="ar-label pt-0.5 text-ar-faint">{k}</dt>
                      <dd className="text-[14.5px] leading-snug text-ar-muted">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-auto pt-5 text-[14px] leading-snug text-ar-faint">{c.status}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[15px] leading-[1.6] text-ar-muted">{transport.next}</p>

        <div className="mt-16 md:mt-20">
          <h3 className="ar-label text-ar-faint">The terms, precisely</h3>
          <dl className="mt-5 grid border-l border-t border-ar-line sm:grid-cols-2 xl:grid-cols-4">
            {transport.terms.map((t) => (
              <div key={t.term} className="border-b border-r border-ar-line p-5 md:p-6">
                <dt className="ar-mono text-[13px] font-medium text-ar-fg">{t.term}</dt>
                <dd className="mt-2.5 text-[14.5px] leading-[1.6] text-ar-muted">{t.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
