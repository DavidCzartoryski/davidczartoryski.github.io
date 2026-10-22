import { artemis } from "@/data/artemis";
import { Arrow, Container, Eyebrow, button } from "./bits";
import Collectives from "./Collectives";

const { bridge } = artemis;

export default function Bridge() {
  return (
    <section id="gpubridge" aria-labelledby="bridge-title" className="border-t border-ar-line bg-ar-panel/50 py-20 md:py-28">
      <Container>
        <div className="grid gap-12 xl:grid-cols-12 xl:gap-10">
          <div className="min-w-0 max-w-[720px] xl:col-span-5 xl:max-w-none">
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

          <div className="min-w-0 xl:col-span-7 xl:pl-6">
            <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
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
        <div className="mt-16 md:mt-20">
          <Collectives />
        </div>
      </Container>
    </section>
  );
}
