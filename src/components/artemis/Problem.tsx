import { artemis } from "@/data/artemis";
import Calculator from "./Calculator";
import { Container, Eyebrow } from "./bits";

const { problem, calculator } = artemis;

export default function Problem() {
  return (
    <section id="problem" aria-labelledby="problem-title" className="border-t border-ar-line py-20 md:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <Eyebrow n="01" className="text-ar-faint">
              The problem
            </Eyebrow>
            <h2 id="problem-title" className="ar-display mt-6 text-[clamp(2.5rem,5.4vw,4.6rem)] leading-[0.95] text-ar-ink">
              {problem.heading}
            </h2>
            <p className="mt-6 max-w-[460px] text-[17px] leading-[1.65] text-ar-muted">{problem.body}</p>
          </div>
          <ol className="grid self-end border-l border-t border-ar-line lg:col-span-7">
            {problem.points.map((p, i) => (
              <li key={p.title} className="grid gap-2 border-b border-r border-ar-line bg-ar-bg p-6 sm:grid-cols-[56px_1fr] sm:gap-4 md:p-7">
                <span className="ar-mono text-[11px] text-ar-faint">0{i + 1}</span>
                <div>
                  <h3 className="text-[17px] font-semibold text-ar-ink">{p.title}</h3>
                  <p className="mt-1.5 text-[15.5px] leading-[1.6] text-ar-muted">{p.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-16 md:mt-20">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between md:gap-10">
            <h3 className="ar-display text-[clamp(1.6rem,2.6vw,2.2rem)] leading-tight text-ar-ink">{calculator.heading}</h3>
            <p className="max-w-[420px] text-[15px] leading-relaxed text-ar-muted md:text-right">{calculator.body}</p>
          </div>
          <Calculator note={calculator.note} />
        </div>
      </Container>
    </section>
  );
}
