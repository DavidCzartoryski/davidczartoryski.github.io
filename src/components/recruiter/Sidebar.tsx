import Link from "next/link";
import { education, layover, recruiter, skills } from "@/data/site";
import { Bullets, SectionHead } from "./bits";

/** The right-hand column: education, skills, and the rest of the person. */
export default function Sidebar() {
  return (
    <div className="space-y-14">
      <section id="education">
        <SectionHead n="03" title="Education" small />
        <h3 className="font-display text-[1.35rem] leading-tight tracking-tight">{education.school}</h3>
        <div className="mt-1 font-mono text-[11px] tracking-[0.18em] text-gold-deep">
          {education.range.toUpperCase()} · {education.city.toUpperCase()}
        </div>
        <p className="mt-2 text-[14px] leading-snug text-ink/85">{education.degree}</p>
        <Bullets items={education.bullets} className="mt-4 text-[14px] text-ink/75" />
      </section>

      <section id="skills">
        <SectionHead n="04" title="Skills" small />
        <dl className="space-y-5">
          {skills.map((g) => (
            <div key={g.group}>
              <dt className="font-mono text-[10px] tracking-[0.25em] text-ink/55">{g.group.toUpperCase()}</dt>
              <dd className="mt-2 flex flex-wrap gap-1.5">
                {g.items.map((s) => (
                  <span key={s} className="rounded-md border border-ink/12 bg-paper-hi px-2 py-0.5 text-[13px] text-ink/85">
                    {s}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="beyond">
        <SectionHead n="05" title="Beyond the résumé" small />
        <dl className="space-y-4">
          {recruiter.beyond.map((b) => (
            <div key={b.k}>
              <dt className="font-mono text-[10px] tracking-[0.25em] text-ink/55">{b.k.toUpperCase()}</dt>
              <dd className="mt-1 text-[14px] leading-relaxed text-ink/80">{b.v}</dd>
            </div>
          ))}
          <div>
            <dt className="font-mono text-[10px] tracking-[0.25em] text-ink/55">INTERESTS</dt>
            <dd className="mt-1 text-[14px] leading-relaxed text-ink/80">{layover.extras.join(" · ")}</dd>
          </div>
        </dl>
        <Link
          href="/"
          className="no-print mt-6 inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] text-gold-deep underline-offset-4 hover:text-ink hover:underline"
        >
          THE STAMPS, THE MAT AND THE PHOTOS ARE IN THE FULL EXPERIENCE →
        </Link>
      </section>
    </div>
  );
}
