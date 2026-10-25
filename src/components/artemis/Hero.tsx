import Link from "next/link";
import { mailto } from "@/data/artemis";
import { Arrow, Container, button } from "./bits";
import PerformanceLoop from "./PerformanceLoop";

export default function Hero() {
  return (
    <section aria-labelledby="hero-title" className="pb-14 pt-14 md:pb-20 md:pt-24">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div>
            <p className="ar-label text-ar-faint">Distributed AI training. Less friction.</p>
            <h1 id="hero-title" className="ar-display mt-6 max-w-[710px] text-[clamp(2.35rem,4.7vw,4.2rem)] leading-[1.07] text-ar-fg">
              An autonomous performance engineer for <span className="text-ar-signal-ink">distributed AI training.</span>
            </h1>
            <p className="mt-7 max-w-[540px] text-[17px] leading-[1.65] text-ar-muted md:text-[19px]">
              Less GPU time wasted. Less engineering time spent chasing slowdowns.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href={mailto("Artemis: let's talk")} className={button.solid}>Talk to the founder <Arrow /></a>
              <Link href="/Artemis/product/" className="group inline-flex min-h-12 items-center gap-2 text-[15px] text-ar-muted transition-colors hover:text-ar-fg">Explore the product <Arrow /></Link>
            </div>
            <p className="mt-5 text-[12px] text-ar-faint">In development. Built with AI infrastructure teams in mind.</p>
          </div>
          <PerformanceLoop />
        </div>
      </Container>
    </section>
  );
}
