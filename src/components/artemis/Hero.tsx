import { mailto } from "@/data/artemis";
import { Arrow, Container, button } from "./bits";
import HeroFigure from "./HeroFigure";

export default function Hero() {
  return (
    <section aria-labelledby="hero-title" className="pb-14 pt-14 md:pb-20 md:pt-24">
      <Container>
        <p className="ar-label text-ar-faint">For teams running distributed AI training</p>
        <h1 id="hero-title" className="ar-display mt-6 max-w-[980px] text-[clamp(2.35rem,4.7vw,4.2rem)] leading-[1.07] text-ar-fg">
          One slow GPU slows your whole training job. <span className="text-ar-signal-ink">Artemis finds it and fixes it.</span>
        </h1>
        <p className="mt-7 max-w-[660px] text-[17px] leading-[1.65] text-ar-muted md:text-[19px]">
          Artemis watches your training jobs while they run. When a rank falls behind, it pinpoints the cause — a GPU, a link, or a host — applies a fix inside the policies you set, and verifies that throughput recovered.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a href={mailto("Artemis: let's talk")} className={button.solid}>Talk to the founder <Arrow /></a>
          <a href="#how" className="group inline-flex min-h-12 items-center gap-2 text-[15px] text-ar-muted transition-colors hover:text-ar-fg">
            See how it works <span aria-hidden="true">↓</span>
          </a>
        </div>
        <p className="mt-5 text-[12px] text-ar-faint">In development · NVIDIA and AMD · Owned or rented clusters</p>
        <div className="mt-14">
          <HeroFigure caption="Rank 2 is running 19% slow. The other seven ranks wait for it at every all-reduce. (Illustration.)" />
        </div>
      </Container>
    </section>
  );
}
