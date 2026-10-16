import { projects } from "@/data/site";
import Reveal from "./Reveal";

/** Built outside the studio: the open-source library up front, the rest beside it. */
export default function ProjectCards() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {projects.map((p, i) => (
        <Reveal
          key={p.id}
          delay={p.featured ? 0 : ((i - 1) % 3) * 0.08}
          className={p.featured ? "md:col-span-3" : undefined}
        >
          <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-ink transition-colors hover:border-gold/40">
            <div className={`h-1 ${p.featured ? "bg-gold" : "bg-line-2"}`} />
            <div className={`flex flex-1 flex-col ${p.featured ? "p-6 md:p-10" : "p-6"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3 font-mono text-[10px] tracking-[0.25em]">
                <span className="text-gold">{p.kind.toUpperCase()}</span>
                <span className="text-fg-dim">{p.status.toUpperCase()}</span>
              </div>
              <h3
                className={`mt-3 font-display leading-none tracking-tight ${
                  p.featured ? "text-5xl md:text-6xl" : "text-3xl"
                }`}
              >
                {p.name}
              </h3>
              <div className="mt-2 font-mono text-[10px] tracking-[0.22em] text-fg-dim">{p.range.toUpperCase()}</div>

              <div className={p.featured ? "mt-6 grid gap-10 lg:grid-cols-12" : "mt-5"}>
                <div className={p.featured ? "lg:col-span-7" : undefined}>
                  <p className="text-[15px] leading-relaxed text-paper/90">{p.blurb}</p>
                  <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-fg-muted">
                    {(p.featured ? p.bullets : p.bullets.slice(0, 2)).map((b) => (
                      <li key={b} className="flex gap-3">
                        <span aria-hidden className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-gold/80" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {p.stats && (
                  <dl className="grid grid-cols-2 content-start gap-px self-start overflow-hidden rounded-xl border border-line bg-line lg:col-span-5">
                    {p.stats.map((s) => (
                      <div key={s.label} className="bg-ink-2 p-5">
                        <dt className="sr-only">{s.label}</dt>
                        <dd>
                          <span className="block font-display text-4xl leading-none tracking-tight text-gold-2">
                            {s.value}
                          </span>
                          <span className="mt-2 block font-mono text-[10px] leading-relaxed tracking-[0.18em] text-fg-dim">
                            {s.label.toUpperCase()}
                          </span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>

              <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-6">
                <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] tracking-[0.16em] text-fg-dim">
                  {p.stack.map((t) => (
                    <span key={t}>{t.toUpperCase()}</span>
                  ))}
                </div>
                {p.links?.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noopener"
                    className="font-mono text-[11px] tracking-[0.2em] text-paper underline-offset-4 hover:text-gold hover:underline"
                  >
                    {l.label.startsWith("github.com") ? "GITHUB" : l.label.toUpperCase()} ↗
                  </a>
                ))}
              </div>
            </div>
          </article>
        </Reveal>
      ))}
    </div>
  );
}
