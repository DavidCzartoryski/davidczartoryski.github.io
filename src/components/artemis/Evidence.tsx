import { artemis, evidenceKinds, type EvidenceKind } from "@/data/artemis";
import { Container, Eyebrow } from "./bits";

const { evidence } = artemis;

const BADGE: Record<EvidenceKind, string> = {
  gpu: "bg-ar-ink text-ar-bg border-ar-ink",
  sim: "border-ar-ink/60 text-ar-ink",
  cpu: "border-dashed border-ar-ink/60 text-ar-ink",
  wip: "border-dotted border-ar-ink/40 text-ar-faint",
};

export default function Evidence() {
  return (
    <section id="evidence" aria-labelledby="evidence-title" className="py-20 md:py-28">
      <Container>
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <Eyebrow n="04" className="text-ar-faint">
              Evidence
            </Eyebrow>
            <h2 id="evidence-title" className="ar-display mt-6 text-[clamp(2.3rem,4.6vw,4rem)] leading-[0.97] text-ar-ink">
              {evidence.heading}
            </h2>
          </div>
          <p className="self-end text-[17px] leading-[1.65] text-ar-muted lg:col-span-6 lg:col-start-7">{evidence.body}</p>
        </div>

        <div className="mt-12 border-t border-ar-ink">
          <div className="ar-mono hidden grid-cols-12 gap-6 border-b border-ar-line py-3 text-[10.5px] uppercase tracking-[0.12em] text-ar-faint md:grid">
            <span className="col-span-6">Result</span>
            <span className="col-span-4">Setup and caveats</span>
            <span className="col-span-2 text-right">Measured on</span>
          </div>
          <ul>
            {evidence.rows.map((row) => (
              <li key={row.result} className="grid gap-3 border-b border-ar-line py-5 md:grid-cols-12 md:gap-6">
                <p className="text-[16px] font-medium leading-snug text-ar-ink md:col-span-6">{row.result}</p>
                <p className="text-[14.5px] leading-snug text-ar-muted md:col-span-4">{row.setup}</p>
                <div className="flex flex-wrap items-start gap-1.5 md:col-span-2 md:flex-col md:items-end">
                  <span className={`ar-mono whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] ${BADGE[row.kind]}`}>
                    {evidenceKinds[row.kind]}
                  </span>
                  {"early" in row && row.early && (
                    <span className="ar-mono whitespace-nowrap rounded-full border border-ar-ink/30 px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-ar-muted">
                      Early, small n
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-12 lg:gap-10">
          <h3 className="ar-display text-[clamp(1.4rem,2.2vw,1.9rem)] leading-tight text-ar-ink lg:col-span-4">
            {evidence.standard.heading}
          </h3>
          <dl className="border-t border-ar-ink lg:col-span-8">
            {evidence.standard.rows.map(([claim, against]) => (
              <div key={claim} className="grid gap-1 border-b border-ar-line py-4 sm:grid-cols-[220px_1fr] sm:gap-6">
                <dt className="text-[15px] font-medium text-ar-ink">{claim}</dt>
                <dd className="text-[15px] leading-snug text-ar-muted">
                  <span className="ar-mono mr-2 text-[10.5px] uppercase tracking-[0.12em] text-ar-faint">vs</span>
                  {against}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
