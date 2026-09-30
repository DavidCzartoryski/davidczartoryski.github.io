import { profile, recruiter } from "@/data/site";

/** The headline numbers, each a link to the role or venture it comes from. */
export default function Impact() {
  return (
    <section aria-labelledby="impact-h" className="mx-auto max-w-6xl px-6">
      <h2 id="impact-h" className="mb-4 font-mono text-[11px] tracking-[0.3em] text-ink/55">
        BY THE NUMBERS
      </h2>
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink/15 bg-ink/15 md:grid-cols-3 xl:grid-cols-6">
        {recruiter.impact.map((m) => (
          <li key={m.value} className="bg-paper-hi">
            <a href={m.href} className="group flex h-full flex-col p-4 transition-colors hover:bg-paper sm:p-5">
              <span className="font-display text-[1.9rem] leading-none tracking-tight sm:text-[2.4rem]">{m.value}</span>
              <span className="mt-3 text-[13px] leading-snug text-ink/70">{m.label}</span>
              <span className="mt-auto block pt-4 font-mono text-[10px] tracking-[0.2em] text-gold-deep">
                {m.source.toUpperCase()}{" "}
                <span aria-hidden className="no-print inline-block transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <figure className="mt-16 max-w-3xl border-l-2 border-gold pl-6 md:pl-8">
        <figcaption className="font-mono text-[10px] tracking-[0.3em] text-gold-deep">THE WORK THAT EXCITES ME</figcaption>
        <blockquote className="mt-4 font-display text-[clamp(1.2rem,2vw,1.5rem)] leading-snug text-ink/90">
          {profile.excites}
        </blockquote>
      </figure>
    </section>
  );
}
