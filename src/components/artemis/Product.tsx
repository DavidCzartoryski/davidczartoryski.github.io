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

        <div className="relative mt-8 grid gap-4 border border-ar-line-2 bg-ar-card p-6 md:grid-cols-[180px_1fr] md:p-7">
          <Ticks />
          <p className="ar-mono text-[10.5px] uppercase tracking-[0.12em] text-ar-faint">Off the critical path</p>
          <p className="max-w-[760px] text-[15.5px] leading-[1.65] text-ar-ink">{product.runtime}</p>
        </div>
      </Container>
    </section>
  );
}
