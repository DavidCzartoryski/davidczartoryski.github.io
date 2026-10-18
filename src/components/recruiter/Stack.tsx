import { skills } from "@/data/site";
import { Caps, SectionHead, pad } from "./bits";
import { Brand } from "./icons";

/** The tools the recent work actually runs on; every group below is in skills (site.ts). */
const CORE = ["Python", "TypeScript", "Rust", "C++", "PyTorch", "CUDA", "ROCm", "Next.js"];

export default function Stack() {
  return (
    <section id="stack" aria-labelledby="stack-h" className="scroll-mt-28 pt-32 md:pt-40">
      <SectionHead id="stack" n="05" kicker="Stack" title="What I build with" aside={`Core · ${pad(CORE.length)} tools`} />

      <ul aria-label="Core tools" className="grid grid-cols-4 gap-2.5 sm:gap-3 lg:grid-cols-8">
        {CORE.map((t) => (
          <li
            key={t}
            className="flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-cv-line bg-cv-card transition duration-300 hover:-translate-y-0.5 hover:border-cv-line-2 hover:bg-white/[0.04] motion-reduce:hover:translate-y-0"
          >
            <Brand name={t} size={26} />
            <span className="text-[12px] text-cv-fg sm:text-[13px]">{t}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-6 rounded-2xl border border-cv-line bg-cv-card px-6 md:px-9">
        {skills.map((g) => (
          <div
            key={g.group}
            className="grid gap-4 border-b border-cv-line py-7 last:border-b-0 md:grid-cols-[200px_1fr] md:gap-8"
          >
            <dt className="md:pt-2">
              <Caps className="text-[10.5px] leading-relaxed text-cv-faint">{g.group}</Caps>
            </dt>
            <dd>
              <ul className="flex flex-wrap gap-2">
                {g.items.map((s) => (
                  <li
                    key={s}
                    className="inline-flex items-center gap-2 rounded-full border border-cv-line bg-white/[0.02] py-1.5 pl-2.5 pr-3.5 text-[13px] text-cv-fg"
                  >
                    <Brand name={s} size={13} />
                    {s}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
