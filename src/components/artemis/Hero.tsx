import { artemis } from "@/data/artemis";
import { Arrow, Container, button } from "./bits";
import HeroFigure from "./HeroFigure";

const { hero } = artemis;

export default function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative pb-16 pt-12 md:pb-24 md:pt-20">
      <Container>
        <p className="ar-label ar-rise text-ar-faint">
          <span className="text-ar-fg">Artemis</span>
          <span aria-hidden="true" className="mx-2.5 opacity-50">
            /
          </span>
          {hero.eyebrow}
        </p>
        <h1
          id="hero-title"
          className="ar-display ar-rise mt-6 text-[clamp(2.2rem,5.3vw,4.35rem)] leading-[1] text-ar-fg"
          style={{ "--ar-d": "80ms" } as React.CSSProperties}
        >
          <span className="md:block">{hero.lead}</span>{" "}
          <span className="text-ar-signal-ink md:block">{hero.mark}</span>
        </h1>
        <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <p
              className="ar-rise max-w-[660px] text-[17px] leading-[1.65] text-ar-muted md:text-[18.5px]"
              style={{ "--ar-d": "160ms" } as React.CSSProperties}
            >
              {hero.lede}
            </p>
            <div className="ar-rise mt-9 flex flex-wrap gap-3" style={{ "--ar-d": "240ms" } as React.CSSProperties}>
              <a href="#detector" className={button.solid}>
                See how it works
                <Arrow className="transition-transform group-hover:translate-x-0.5" />
              </a>
              <a href={artemis.github} className={button.line}>
                GPUBridge on GitHub
              </a>
            </div>
            <p className="ar-rise mt-6 text-[14px] text-ar-faint" style={{ "--ar-d": "280ms" } as React.CSSProperties}>
              A project by{" "}
              <a href="#about" className="text-ar-fg underline decoration-ar-line-2 underline-offset-4 hover:decoration-ar-fg">
                {artemis.founder}
              </a>
              . GPUBridge is open source under MIT.
            </p>
          </div>
          <dl
            className="ar-rise self-start border-t border-ar-line-2 lg:col-span-4 lg:col-start-9"
            style={{ "--ar-d": "320ms" } as React.CSSProperties}
          >
            {hero.specs.map((s) => (
              <div key={s.k} className="grid grid-cols-[96px_1fr] gap-4 border-b border-ar-line py-3.5">
                <dt className="ar-label pt-0.5 text-ar-faint">{s.k}</dt>
                <dd className="text-[14.5px] text-ar-fg">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="ar-rise mt-14 md:mt-20" style={{ "--ar-d": "420ms" } as React.CSSProperties}>
          <HeroFigure />
        </div>
      </Container>
    </section>
  );
}
