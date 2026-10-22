import { artemis } from "@/data/artemis";
import { Arrow, Container, SectionHead } from "./bits";

const { story } = artemis;

/** The build, in order. Each step that has a section below links to it. */
export default function Story() {
  return (
    <section id="story" aria-labelledby="story-title" className="border-t border-ar-line py-20 md:py-28">
      <Container>
        <SectionHead id="story-title" n="02" eyebrow={story.eyebrow} title={story.heading} lede={story.body} />

        <ol className="relative mt-14 grid gap-px overflow-hidden border border-ar-line bg-ar-line md:grid-cols-2 xl:grid-cols-3">
          {story.steps.map((s, i) => {
            const last = i === story.steps.length - 1;
            const body = (
              <>
                <div className="flex items-center justify-between gap-4">
                  <span className="ar-mono text-[11px] text-ar-faint">{String(i + 1).padStart(2, "0")}</span>
                  <span
                    className={`ar-label rounded-full border px-2.5 py-1 text-[9.5px] ${
                      last ? "border-dashed border-ar-line-2 text-ar-faint" : "border-ar-line-2 text-ar-muted"
                    }`}
                  >
                    {s.tag}
                  </span>
                </div>
                <h3 className="ar-display mt-8 text-[24px] leading-tight text-ar-fg">{s.title}</h3>
                <p className="mt-3 text-[15px] leading-[1.6] text-ar-muted">{s.body}</p>
                {"href" in s && (
                  <span className="ar-label mt-auto inline-flex items-center gap-2 pt-6 text-ar-faint transition-colors group-hover:text-ar-fg">
                    Read more <Arrow className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </>
            );
            return (
              <li key={s.title} className="flex bg-ar-bg">
                {"href" in s ? (
                  <a href={s.href} className="group flex w-full flex-col p-6 transition-colors hover:bg-ar-panel md:p-7">
                    {body}
                  </a>
                ) : (
                  <div className="flex w-full flex-col p-6 md:p-7">{body}</div>
                )}
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}
