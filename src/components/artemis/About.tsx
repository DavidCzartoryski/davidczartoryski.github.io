import { artemis } from "@/data/artemis";
import { Container, Eyebrow, Ticks } from "./bits";

const { about } = artemis;

export default function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="border-t border-ar-line py-20 md:py-28">
      <Container>
        <div className="relative grid gap-8 border border-ar-line-2 bg-ar-panel p-6 md:grid-cols-[200px_1fr] md:gap-10 md:p-10 lg:grid-cols-[240px_1fr]">
          <Ticks />
          <img
            src={about.photo.src}
            width={240}
            height={240}
            alt={about.photo.alt}
            loading="lazy"
            className="aspect-square w-32 rounded-[3px] object-cover ring-1 ring-ar-line-2 md:w-full"
          />
          <div>
            <Eyebrow n="08">{about.role}</Eyebrow>
            <h2 id="about-title" className="ar-display mt-5 text-[clamp(1.9rem,3.4vw,2.8rem)] leading-[1.05] text-ar-fg">
              {about.heading}
            </h2>
            <div className="mt-6 max-w-[680px] space-y-4 text-[16.5px] leading-[1.65] text-ar-muted">
              {about.body.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
            <ul className="mt-8 flex flex-wrap gap-2">
              {about.links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="inline-flex h-10 items-center rounded-full border border-ar-line-2 px-4 text-[14px] text-ar-fg transition-colors hover:border-ar-fg/60"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
