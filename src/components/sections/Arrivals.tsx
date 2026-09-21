import { profile } from "@/data/site";
import Reveal from "../Reveal";
import SectionHeader from "../SectionHeader";

const rows = [
  { k: "EMAIL", v: profile.email, href: `mailto:${profile.email}` },
  { k: "LINKEDIN", v: "linkedin.com/in/davidczartoryski", href: profile.linkedin },
  { k: "GITHUB", v: "github.com/DavidCzartoryski", href: profile.github },
  { k: "INSTAGRAM", v: profile.handle, href: profile.instagram },
  { k: "TIKTOK", v: profile.handle, href: profile.tiktok },
  { k: "RÉSUMÉ", v: "DavidCzartoryski_Resume.pdf", href: profile.resume },
];

export default function Arrivals() {
  return (
    <section id="arrivals" className="relative mx-auto max-w-7xl scroll-mt-24 px-6 py-28 md:py-36">
      <SectionHeader
        n="06"
        kicker="Arrivals"
        title={
          <>
            Now <em className="italic text-gold-2">landing.</em>
          </>
        }
        blurb="If you are hiring for 2027, building something, or just passing through Boston, Warsaw, or Milan, my inbox is open."
      />

      <div className="grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <div className="font-mono text-[10px] tracking-[0.3em] text-fg-dim">OPEN TO</div>
          <ul className="mt-4 space-y-3">
            {profile.openTo.map((o) => (
              <li key={o} className="flex gap-3 text-[16px] leading-relaxed text-paper/90">
                <span className="mt-[11px] h-1 w-1 shrink-0 rounded-full bg-gold" />
                {o}
              </li>
            ))}
          </ul>
          <a
            href={`mailto:${profile.email}`}
            className="mt-10 inline-flex items-center gap-3 rounded-full bg-gold px-7 py-4 font-mono text-[12px] font-semibold tracking-[0.28em] text-ink transition-transform hover:-translate-y-0.5"
          >
            SEND A MESSAGE →
          </a>
        </Reveal>

        <Reveal className="lg:col-span-7" delay={0.1}>
          <div className="overflow-hidden rounded-2xl border border-line">
            <div className="flex items-center justify-between border-b border-line bg-ink-2/60 px-5 py-3 font-mono text-[10px] tracking-[0.3em] text-fg-dim">
              <span>BAGGAGE CLAIM</span>
              <span>BELT 06</span>
            </div>
            <ul>
              {rows.map((r) => (
                <li key={r.k} className="border-b border-line last:border-b-0">
                  <a
                    href={r.href}
                    target={r.href.startsWith("mailto:") ? undefined : "_blank"}
                    rel="noopener"
                    className="group grid grid-cols-[110px_1fr_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-ink-2/60 md:grid-cols-[140px_1fr_auto]"
                  >
                    <span className="font-mono text-[10px] tracking-[0.3em] text-gold">{r.k}</span>
                    <span className="truncate font-mono text-[13px] tracking-[0.04em] text-paper">{r.v}</span>
                    <span className="font-mono text-[12px] text-fg-dim transition-transform group-hover:translate-x-1 group-hover:text-paper">
                      →
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
