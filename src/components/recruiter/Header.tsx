import { education, profile, recruiter } from "@/data/site";
import CopyEmail from "./CopyEmail";

const outline =
  "inline-flex h-11 items-center gap-2 rounded-full border border-ink/25 px-5 font-mono text-[11px] tracking-[0.22em] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper";

export default function Header() {
  return (
    <section id="top" className="mx-auto grid max-w-6xl gap-12 px-6 pb-14 pt-14 md:pt-20 lg:grid-cols-12 lg:items-end">
      <div className="lg:col-span-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] tracking-[0.28em] text-gold-deep">
          <span>{profile.role.toUpperCase()}</span>
          <span aria-hidden className="hidden h-px w-8 bg-ink/20 sm:block" />
          <span>NORTHEASTERN · {profile.graduation.toUpperCase()}</span>
        </div>

        <h1 className="mt-6 font-display text-[clamp(3rem,8vw,6.25rem)] leading-[0.92] tracking-[-0.03em]">
          {profile.first} <em className="italic text-gold-deep">{profile.last}</em>
        </h1>

        <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-ink/75 md:text-[19px]">{recruiter.lede}</p>

        <div className="no-print mt-8 flex flex-wrap items-center gap-3">
          <a
            href={profile.resume}
            target="_blank"
            rel="noopener"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 font-mono text-[11px] font-semibold tracking-[0.22em] text-paper transition-transform hover:-translate-y-0.5"
          >
            RÉSUMÉ (PDF) <span aria-hidden>↓</span>
          </a>
          <a href={`mailto:${profile.email}`} className={outline}>
            EMAIL
          </a>
          <a href={profile.linkedin} target="_blank" rel="noopener" className={outline}>
            LINKEDIN <span aria-hidden>↗</span>
          </a>
          <a href={profile.github} target="_blank" rel="noopener" className={outline}>
            GITHUB <span aria-hidden>↗</span>
          </a>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[12px] tracking-[0.04em] text-ink/70">
          <a href={`mailto:${profile.email}`} className="underline-offset-4 hover:text-ink hover:underline">
            {profile.email}
          </a>
          <CopyEmail
            email={profile.email}
            className="no-print rounded-full bg-ink/[0.06] px-3 py-1 text-[10px] tracking-[0.22em] text-ink/70 transition-colors hover:bg-ink/10 hover:text-ink"
          />
        </div>
      </div>

      <div className="lg:col-span-4">
        <Glance />
      </div>
    </section>
  );
}

function Glance() {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink/15 bg-paper-hi shadow-[0_24px_60px_-40px_rgba(11,16,32,0.55)]">
      <div className="flex items-center justify-between border-b border-ink/10 px-5 py-3 font-mono text-[10px] tracking-[0.3em] text-ink/60">
        <span>AT A GLANCE</span>
        <span className="flex items-center gap-2 text-stamp-green">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-stamp-green" />
          OPEN TO WORK
        </span>
      </div>
      <dl className="divide-y divide-ink/10 text-[14px] leading-snug">
        <Row k="Open to">
          <ul className="space-y-1.5">
            {profile.openTo.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </Row>
        <Row k="Graduating">
          {education.range} · {profile.school}
        </Row>
        <Row k="Degree">{profile.degree}</Row>
        <Row k="Based in">{profile.bases.map((b) => b.city).join(" · ")}</Row>
      </dl>
    </div>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-4 px-5 py-3.5">
      <dt className="pt-0.5 font-mono text-[10px] tracking-[0.22em] text-ink/50">{k.toUpperCase()}</dt>
      <dd className="text-ink/85">{children}</dd>
    </div>
  );
}
