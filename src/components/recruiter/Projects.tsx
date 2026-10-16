import { projects, type Project } from "@/data/site";
import { Bullets, Chips, Label, SectionHead } from "./bits";

export default function Projects() {
  const featured = projects.find((p) => p.featured);
  const rest = projects.filter((p) => p !== featured);
  return (
    <section id="projects" aria-labelledby="projects-h" className="scroll-mt-24 pt-24">
      <SectionHead id="projects" n="04" title="Projects" aside="Open source & independent" />
      <ul className="space-y-4">
        {featured && <Featured p={featured} />}
        {rest.map((p) => (
          <li key={p.id} id={p.id} className="scroll-mt-24 rounded-xl p-6 ring-1 ring-cv-line md:p-7">
            <article>
              <Head p={p} />
              <p className="mt-3 text-[15.5px] leading-relaxed text-cv-fg">{p.blurb}</p>
              <Bullets items={p.bullets} className="mt-4 text-[14.5px] text-cv-muted" />
              <Foot p={p} />
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The flagship gets the one dark card on the page, with its numbers up top. */
function Featured({ p }: { p: Project }) {
  return (
    <li id={p.id} className="cv-inv scroll-mt-24 overflow-hidden rounded-xl bg-cv-inv text-cv-inv-fg ring-1 ring-cv-inv-line">
      <article>
        <div className="p-6 md:p-8">
          <Head p={p} inv />
          <p className="mt-4 text-[16px] leading-relaxed text-cv-inv-fg/90">{p.blurb}</p>
        </div>
        {p.stats && (
          <dl className="grid grid-cols-2 gap-px border-y border-cv-inv-line bg-cv-inv-line sm:grid-cols-4">
            {p.stats.map((s) => (
              <div key={s.label} className="bg-cv-inv px-5 py-4 md:px-6">
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="block text-[1.8rem] font-semibold leading-none tracking-[-0.04em] text-cv-inv-accent">
                    {s.value}
                  </span>
                  <span className="mt-2 block text-[12.5px] leading-snug text-cv-inv-muted">{s.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        )}
        <div className="p-6 md:p-8">
          <Bullets items={p.bullets} inv className="text-[14.5px] text-cv-inv-muted" />
          <Foot p={p} inv />
        </div>
      </article>
    </li>
  );
}

function Head({ p, inv }: { p: Project; inv?: boolean }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
      <div className="min-w-0">
        <Label className={inv ? "text-cv-inv-accent" : "text-cv-faint"}>{p.kind}</Label>
        <h3
          className={`mt-1.5 font-semibold leading-tight tracking-[-0.03em] ${inv ? "text-[1.9rem]" : "text-[1.3rem]"}`}
        >
          {p.name}
        </h3>
      </div>
      <div className="flex flex-col items-start gap-1.5 sm:items-end">
        <span className={`font-mono text-[12px] ${inv ? "text-cv-inv-muted" : "text-cv-fg"}`}>{p.range}</span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${
            inv ? "bg-white/[0.08] text-cv-inv-fg" : "bg-cv-surface text-cv-muted ring-1 ring-inset ring-cv-line"
          }`}
        >
          {p.status}
        </span>
      </div>
    </div>
  );
}

function Foot({ p, inv }: { p: Project; inv?: boolean }) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <Chips items={p.stack} inv={inv} />
      {p.links?.map((l) => (
        <a
          key={l.href}
          href={l.href}
          target="_blank"
          rel="noopener"
          className={`text-[14px] font-medium underline-offset-4 hover:underline ${inv ? "text-cv-inv-accent" : "text-cv-accent"}`}
        >
          {l.label} ↗
        </a>
      ))}
    </div>
  );
}
