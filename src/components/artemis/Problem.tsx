import { artemis } from "@/data/artemis";
import RegressionChart from "./RegressionChart";
import { Container, Eyebrow, Ticks } from "./bits";

const { problem } = artemis;

export default function Problem() {
  return (
    <section id="problem" aria-labelledby="problem-title" className="border-t border-ar-line py-20 md:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <Eyebrow n="01">{problem.eyebrow}</Eyebrow>
            <h2 id="problem-title" className="ar-display mt-6 text-[clamp(2rem,3.9vw,3.3rem)] leading-[1.04] text-ar-fg">
              {problem.heading}
            </h2>
            {problem.body.map((p) => (
              <p key={p.slice(0, 24)} className="mt-6 max-w-[560px] text-[17px] leading-[1.65] text-ar-muted">
                {p}
              </p>
            ))}
          </div>
          <div className="self-end lg:col-span-6">
            <p className="ar-label text-ar-faint">Where regressions come from</p>
            <ul className="mt-4 grid border-l border-t border-ar-line sm:grid-cols-2">
              {problem.causes.map((c) => (
                <li key={c.title} className="border-b border-r border-ar-line p-5">
                  <h3 className="text-[16px] font-semibold text-ar-fg">{c.title}</h3>
                  <p className="mt-1.5 text-[14.5px] leading-[1.55] text-ar-muted">{c.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 grid gap-6 md:mt-20 lg:grid-cols-12">
          <figure className="relative min-w-0 border border-ar-line-2 bg-ar-panel p-5 md:p-7 lg:col-span-8">
            <Ticks />
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between md:gap-8">
              <h3 className="ar-display text-[clamp(1.35rem,2.2vw,1.75rem)] leading-tight text-ar-fg">{problem.chart.heading}</h3>
              <p className="max-w-[340px] text-[14px] leading-snug text-ar-muted md:text-right">{problem.chart.body}</p>
            </div>
            <div className="mt-6">
              <RegressionChart />
            </div>
            <figcaption className="mt-4 text-[13px] leading-relaxed text-ar-faint">{problem.chart.caption}</figcaption>
          </figure>

          <aside className="flex flex-col gap-8 border border-ar-line-2 p-6 md:p-7 lg:col-span-4" aria-labelledby="cost-title">
            <div>
              <h3 id="cost-title" className="ar-label text-ar-faint">
                What it costs
              </h3>
              <p className="ar-mono mt-5 whitespace-nowrap text-[clamp(1.6rem,2.4vw,2.1rem)] leading-none text-ar-fg">
                {problem.cost.formula}
              </p>
              <p className="mt-5 text-[15.5px] leading-[1.6] text-ar-muted">{problem.cost.body}</p>
            </div>
            <table className="ar-mono w-full text-[12px] tabular-nums">
              <caption className="ar-label pb-3 text-left text-[9.5px] text-ar-faint">One slow rank, the whole job, at most</caption>
              <thead className="text-ar-faint">
                <tr className="border-b border-ar-line-2">
                  <th scope="col" className="py-2 text-left font-normal">Rank slower by</th>
                  <th scope="col" className="py-2 text-right font-normal">GPU-hours waiting</th>
                </tr>
              </thead>
              <tbody>
                {problem.cost.examples.map((e) => (
                  <tr key={e.slow} className="border-b border-ar-line">
                    <td className="py-2 text-ar-muted">{e.slow}</td>
                    <td className="py-2 text-right text-ar-fg">{e.idle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div aria-hidden="true" className="mt-auto">
              <div className="flex h-2.5 overflow-hidden rounded-[2px]">
                <div className="bg-ar-fg/25" style={{ width: `${100 - (0.08 / 1.08) * 100}%` }} />
                <div className="ml-[2px] bg-ar-signal" style={{ width: `${(0.08 / 1.08) * 100}%` }} />
              </div>
              <div className="ar-mono mt-2.5 flex justify-between text-[10.5px] uppercase tracking-[0.08em] text-ar-faint">
                <span>512 GPUs, one 8% slow</span>
                <span className="text-ar-fg">up to 38 waiting</span>
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </section>
  );
}
