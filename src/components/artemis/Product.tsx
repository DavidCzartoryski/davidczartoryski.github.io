import { artemis } from "@/data/artemis";
import { Container, Eyebrow, Ticks } from "./bits";

const { product } = artemis;

export default function Product() {
  return (
    <section id="product" aria-labelledby="product-title" className="border-t border-ar-line py-20 md:py-28">
      <Container>
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Eyebrow n="02" className="text-ar-faint">
              {product.eyebrow}
            </Eyebrow>
            <h2 id="product-title" className="ar-display mt-6 text-[clamp(2.3rem,4.6vw,4rem)] leading-[0.97] text-ar-ink">
              {product.heading}
            </h2>
          </div>
          <div className="lg:col-span-6 lg:pt-12">
            <p className="text-[17px] leading-[1.65] text-ar-muted">{product.body}</p>
            <figure className="relative mt-8 border border-ar-ink bg-ar-ink text-ar-night-fg">
              <figcaption className="ar-mono flex items-center justify-between border-b border-ar-night-line px-4 py-2.5 text-[10.5px] uppercase tracking-[0.12em] text-ar-night-faint">
                <span>One command, no change to the script</span>
                <span aria-hidden="true" className="flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-ar-night-fg/20" />
                  <span className="h-2 w-2 rounded-full bg-ar-night-fg/20" />
                  <span className="h-2 w-2 rounded-full bg-ar-night-fg/20" />
                </span>
              </figcaption>
              <pre className="ar-mono whitespace-pre-wrap break-words px-4 py-4 text-[12.5px] leading-relaxed">
                <code>
                  <span className="select-none text-ar-night-faint">$ </span>
                  {product.attach}
                </code>
              </pre>
            </figure>
          </div>
        </div>

        <ol className="mt-14 grid border-l border-t border-ar-line md:grid-cols-2 xl:grid-cols-4">
          {product.steps.map((s) => (
            <li key={s.n} className="relative flex flex-col border-b border-r border-ar-line bg-ar-bg p-6 md:p-7">
              <div className="flex items-center justify-between">
                <span className="ar-mono text-[11px] text-ar-faint">{s.n}</span>
                <span aria-hidden="true" className="h-px w-10 bg-ar-ink/30" />
              </div>
              <h3 className="ar-display mt-10 text-[26px] leading-none text-ar-ink">{s.title}</h3>
              <p className="mt-4 text-[15px] leading-[1.6] text-ar-muted">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-16 grid gap-10 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <h3 className="ar-display text-[clamp(1.6rem,2.6vw,2.2rem)] leading-tight text-ar-ink">From finding to fix</h3>
            <ul className="mt-6 divide-y divide-ar-line border-y border-ar-line">
              {product.modes.map((m) => (
                <li key={m.title} className="grid grid-cols-[112px_1fr] gap-4 py-4">
                  <span className="text-[16px] font-semibold text-ar-ink">{m.title}</span>
                  <div>
                    <p className="text-[15px] leading-[1.55] text-ar-muted">{m.body}</p>
                    <p className="ar-mono mt-2 text-[10px] uppercase tracking-[0.12em] text-ar-faint">{m.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-7">
            <p className="ar-mono text-[10.5px] uppercase tracking-[0.12em] text-ar-faint">Every automatic change</p>
            <ol className="mt-4 grid gap-px border border-ar-line bg-ar-line sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
              {product.chain.map((c, i) => (
                <li key={c} className="flex min-h-[88px] flex-col justify-between gap-3 bg-ar-bg p-4">
                  <span className="ar-mono text-[10.5px] text-ar-faint">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[14.5px] font-medium leading-snug text-ar-ink">{c}</span>
                </li>
              ))}
              <li className="flex min-h-[88px] flex-col justify-between gap-3 bg-ar-ink p-4 text-ar-bg">
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M13 8a5 5 0 1 1-1.6-3.7M13 2.5v2.8h-2.8" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <span className="text-[14.5px] font-medium leading-snug">Keep measuring</span>
              </li>
            </ol>
            <p className="mt-6 border-l-2 border-ar-ink pl-4 text-[16px] leading-[1.6] text-ar-ink">{product.principle}</p>
          </div>
        </div>

        <div className="relative mt-16 grid gap-4 border border-ar-line-2 bg-ar-card p-6 md:grid-cols-[180px_1fr] md:p-7">
          <Ticks />
          <p className="ar-mono text-[10.5px] uppercase tracking-[0.12em] text-ar-faint">Off the critical path</p>
          <p className="max-w-[760px] text-[15.5px] leading-[1.65] text-ar-ink">{product.runtime}</p>
        </div>
      </Container>
    </section>
  );
}
