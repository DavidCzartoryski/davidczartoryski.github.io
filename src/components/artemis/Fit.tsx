import { artemis } from "@/data/artemis";
import { Container, Eyebrow, Ticks } from "./bits";

const { fit } = artemis;

/** How it sits inside a cluster's existing operating model, and the claims it doesn't make. */
export default function Fit() {
  return (
    <section aria-labelledby="fit-title" className="border-t border-ar-line py-20 md:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Eyebrow n="05" className="text-ar-faint">
              Deployment
            </Eyebrow>
            <h2 id="fit-title" className="ar-display mt-6 text-[clamp(2.3rem,4.6vw,4rem)] leading-[0.97] text-ar-ink">
              {fit.heading}
            </h2>
            <p className="mt-6 max-w-[520px] text-[17px] leading-[1.65] text-ar-muted">{fit.body}</p>
            <ul className="mt-10 border-t border-ar-line">
              {fit.does.map((d, i) => (
                <li key={d} className="grid grid-cols-[44px_1fr] border-b border-ar-line py-4">
                  <span className="ar-mono pt-0.5 text-[11px] text-ar-faint">0{i + 1}</span>
                  <span className="text-[15.5px] leading-[1.55] text-ar-ink">{d}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="self-end lg:col-span-5">
            <div className="relative border border-ar-line-2 bg-ar-card p-6 md:p-8">
              <Ticks />
              <h3 className="ar-mono text-[10.5px] uppercase tracking-[0.12em] text-ar-faint">{fit.isNot.heading}</h3>
              <ul className="mt-5 space-y-3.5">
                {fit.isNot.items.map((item) => (
                  <li key={item} className="flex gap-3 text-[15px] leading-snug text-ar-muted">
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="mt-[5px] shrink-0 text-ar-ink/50">
                      <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
