import { artemis } from "@/data/artemis";
import { Container, Eyebrow, Ticks } from "./bits";

const { founders } = artemis;

export default function Founders() {
  return (
    <section id="founders" aria-labelledby="founders-title" className="border-t border-ar-line py-20 md:py-28">
      <Container>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow n="06" className="text-ar-faint">
              Team
            </Eyebrow>
            <h2 id="founders-title" className="ar-display mt-6 text-[clamp(2.3rem,4.6vw,4rem)] leading-[0.97] text-ar-ink">
              {founders.heading}
            </h2>
          </div>
        </div>

        <figure className="relative mt-12 overflow-hidden border border-ar-line-2">
          <img
            src={founders.photo.src}
            width={founders.photo.width}
            height={founders.photo.height}
            alt={founders.photo.alt}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover object-[50%_30%] sm:aspect-[16/8]"
          />
          <figcaption className="ar-mono absolute bottom-0 left-0 bg-ar-bg/90 px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-ar-muted backdrop-blur">
            Thomas and David · San Francisco
          </figcaption>
        </figure>

        <ul className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {founders.people.map((p) => (
            <li key={p.name} className="relative flex flex-col border border-ar-line-2 bg-ar-card p-6 md:p-8">
              <Ticks />
              <div className="flex items-center gap-5">
                <img
                  src={p.photo.src}
                  width={96}
                  height={96}
                  alt={p.photo.alt}
                  loading="lazy"
                  className="h-20 w-20 shrink-0 rounded-full object-cover ring-1 ring-ar-line-2 md:h-24 md:w-24"
                />
                <div>
                  <h3 className="ar-display text-[24px] leading-tight text-ar-ink md:text-[26px]">{p.name}</h3>
                  <p className="ar-mono mt-1.5 text-[10.5px] uppercase tracking-[0.12em] text-ar-faint">{p.role}</p>
                </div>
              </div>
              <div className="mt-6 space-y-3.5 text-[15.5px] leading-[1.65] text-ar-muted">
                {p.body.map((para) => (
                  <p key={para.slice(0, 24)}>{para}</p>
                ))}
              </div>
              <ul className="mt-auto flex flex-wrap gap-2 pt-7">
                {p.links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="inline-flex h-9 items-center rounded-full border border-ar-line-2 px-4 text-[13.5px] text-ar-ink transition-colors hover:border-ar-ink/50"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
