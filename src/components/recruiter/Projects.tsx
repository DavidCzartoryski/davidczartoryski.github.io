import { projects, ventureDeep, type Project } from "@/data/site";
import { Breakdown, Bullets, Caps, Dot, More, SectionHead, pad } from "./bits";
import Card, { Badge, Code, Foot, Sky } from "./Card";

/** Bullets the flagship shows before "More". */
const SHOWN = 2;

export default function Projects() {
  const featured = projects.find((p) => p.featured);
  const rest = projects.filter((p) => p !== featured);
  const code = (p: Project) => `P/${pad(projects.indexOf(p) + 1)}`;
  return (
    <section id="projects" aria-labelledby="projects-h" className="scroll-mt-28 pt-32 md:pt-40">
      <SectionHead
        id="projects"
        n="04"
        kicker="Projects"
        title="Research & featured work"
        aside={`${pad(projects.length)} projects`}
      />
      <ul className="grid gap-5 lg:grid-cols-3">
        {featured && <Featured p={featured} code={code(featured)} />}
        {rest.map((p) => (
          <Card
            key={p.id}
            id={p.id}
            code={code(p)}
            meta={p.range}
            name={p.name}
            badge={p.status}
            blurb={p.blurb}
            stack={p.stack}
            links={p.links}
          >
            <More label="How it was built" count={p.bullets.length}>
              <Bullets items={p.bullets} className="text-[14px]" />
            </More>
          </Card>
        ))}
      </ul>
    </section>
  );
}

/** The flagship spans the row: its numbers on the sky, the write-up beside them. */
function Featured({ p, code }: { p: Project; code: string }) {
  const deep = p.id === "gpubridge" ? ventureDeep.straggler : undefined;
  return (
    <li
      id={p.id}
      className="scroll-mt-28 overflow-hidden rounded-2xl border border-cv-line-2 bg-cv-card lg:col-span-3 lg:grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]"
    >
      <Sky seed={p.id} tall className="min-h-[340px] lg:border-b-0 lg:border-r">
        <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-cv-line-2 bg-black/40 px-3 py-1 backdrop-blur">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-cv-accent" />
          <Caps className="text-[9.5px] text-cv-fg">Featured</Caps>
        </div>
        {p.stats && (
          <dl className="absolute inset-x-0 bottom-0 grid grid-cols-2 gap-px border-t border-cv-line bg-cv-line">
            {p.stats.map((s) => (
              <div key={s.label} className="bg-cv-bg/80 px-5 py-4 backdrop-blur-sm">
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="block text-[1.75rem] font-light leading-none tracking-[-0.04em] text-cv-fg">
                    {s.value}
                  </span>
                  <span className="mt-2 block text-[12px] leading-snug text-cv-muted">{s.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        )}
      </Sky>

      <article className="flex flex-col p-6 md:p-9">
        <Code code={code} meta={p.range} />
        <h3 className="mt-5 text-[clamp(1.6rem,2.6vw,2rem)] font-light leading-tight tracking-[-0.03em]">
          <Dot>{p.name}</Dot>
        </h3>
        <Caps className="mt-2 block text-[10.5px] leading-relaxed text-cv-accent">{p.kind}</Caps>
        <Badge>{p.status}</Badge>
        <p className="mt-6 text-[15px] leading-relaxed text-cv-fg/85">{p.blurb}</p>
        {/* Print has no sky, so the numbers come along as text. */}
        {p.stats && (
          <p className="mt-4 hidden text-[13px] text-cv-muted print:block">
            {p.stats.map((s) => `${s.value} ${s.label}`).join(" · ")}
          </p>
        )}
        <Bullets items={p.bullets.slice(0, SHOWN)} className="mt-6 text-[14.5px]" />
        {p.bullets.length > SHOWN && (
          <More label="How it was built" count={p.bullets.length - SHOWN}>
            <Bullets items={p.bullets.slice(SHOWN)} className="text-[14.5px]" />
          </More>
        )}
        {deep && (
          <More id="straggler" label="The straggler detector, in depth" count={deep.sections.length}>
            <Breakdown tagline={deep.tagline} sections={deep.sections} />
          </More>
        )}
        <Foot stack={p.stack} links={p.links} />
      </article>
    </li>
  );
}
