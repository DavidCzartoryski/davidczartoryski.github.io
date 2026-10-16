import { Fragment } from "react";
import Link from "next/link";
import { education, layover, recruiter, skills } from "@/data/site";
import { Bullets, Label, SectionHead } from "./bits";

/** Education, skills, and the rest of the person. */
export default function Background() {
  const beyond = [...recruiter.beyond, { k: "Interests", v: layover.extras.join(" · ") }];
  return (
    <section id="education" aria-labelledby="education-h" className="scroll-mt-24 pt-24">
      <SectionHead id="education" n="05" title="Education & skills" />

      <div className="grid gap-x-12 gap-y-14 xl:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h3 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.025em]">{education.school}</h3>
            <div className="font-mono text-[12px] text-cv-fg">{education.range}</div>
          </div>
          <div className="mt-0.5 text-[15px] font-medium text-cv-accent">{education.degree}</div>
          <div className="mt-0.5 text-[14px] text-cv-muted">
            {education.concentration} · {education.city}
          </div>
          <Bullets items={education.bullets} className="mt-5 text-[14.5px] text-cv-muted" />
        </div>

        <div id="skills" className="scroll-mt-24">
          <h3 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.025em]">Skills</h3>
          <dl className="mt-5 space-y-5">
            {skills.map((g) => (
              <div key={g.group}>
                <dt>
                  <Label className="text-cv-faint">{g.group}</Label>
                </dt>
                <dd className="mt-2 text-[14.5px] leading-relaxed text-cv-fg">
                  {g.items.map((s, i) => (
                    <Fragment key={s}>
                      <span className="whitespace-nowrap">{s}</span>
                      {i < g.items.length - 1 && (
                        <>
                          {" "}
                          <span aria-hidden className="text-cv-line-2">
                            ·
                          </span>{" "}
                        </>
                      )}
                    </Fragment>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="mt-16">
        <h3 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.025em]">Beyond the résumé</h3>
        <dl className="mt-5 grid gap-px overflow-hidden rounded-xl bg-cv-line ring-1 ring-cv-line sm:grid-cols-2">
          {beyond.map((b) => (
            <div key={b.k} className="bg-cv-bg px-5 py-4">
              <dt>
                <Label className="text-cv-faint">{b.k}</Label>
              </dt>
              <dd className="mt-1.5 text-[14.5px] leading-relaxed text-cv-fg">{b.v}</dd>
            </div>
          ))}
        </dl>
        <Link
          href="/"
          className="no-print mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-cv-accent underline-offset-4 hover:underline"
        >
          The stamps, the mat and the photos are in the full site →
        </Link>
      </div>
    </section>
  );
}
