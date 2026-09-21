"use client";

import { useCallback, useState } from "react";
import { motion } from "motion/react";
import countries from "@/data/countries.json";
import { profile } from "@/data/site";
import { photosFor } from "@/lib/photos";
import Lightbox, { type LightboxState } from "../Lightbox";
import Reveal from "../Reveal";
import SectionHeader from "../SectionHeader";
import Stamp, { StampDefs } from "../Stamp";
import WorldMap from "../WorldMap";

export default function Passport() {
  const [lightbox, setLightbox] = useState<LightboxState>(null);
  const [highlight, setHighlight] = useState<string | null>(null);

  const open = useCallback((slug: string) => {
    const c = countries.find((x) => x.slug === slug);
    const photos = photosFor(slug);
    if (!c || photos.length === 0) return;
    setLightbox({ photos, index: 0, title: c.name });
  }, []);

  const regions = Array.from(new Set(countries.map((c) => c.region)));

  return (
    <section id="passport" className="relative mx-auto max-w-7xl scroll-mt-24 px-6 py-28 md:py-36">
      <StampDefs />
      <SectionHeader
        n="01"
        kicker="Passport"
        title={
          <>
            Twenty-three countries, <em className="italic text-gold-2">one</em> passport.
          </>
        }
        blurb="Every outline below is the real border, projected from the same atlas cartographers use. Tap a stamp with film in it to open the photos. The rest are waiting on the next roll."
      />

      <Reveal className="rounded-2xl border border-line bg-ink-2/50 p-3 md:p-6">
        <WorldMap onPick={open} highlight={highlight} />
      </Reveal>

      {/* home bases */}
      <Reveal className="mt-10 grid gap-4 md:grid-cols-3">
        {profile.bases.map((b, i) => (
          <div key={b.code} className="flex items-center gap-5 rounded-xl border border-line px-5 py-4">
            <span className="font-display text-4xl tracking-tight text-gold-2">{b.code}</span>
            <div>
              <div className="font-mono text-[10px] tracking-[0.28em] text-fg-dim">HOME BASE 0{i + 1} · {b.city.toUpperCase()}</div>
              <div className="mt-1 text-[14px] text-fg-muted">{b.note}</div>
            </div>
          </div>
        ))}
      </Reveal>

      {/* stamps */}
      <div className="mt-20">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="font-mono text-[11px] tracking-[0.3em] text-fg-dim">ENTRY STAMPS · {countries.length}</div>
          <div className="flex flex-wrap gap-2 font-mono text-[10px] tracking-[0.2em] text-fg-dim">
            {regions.map((r) => (
              <span key={r} className="rounded-full border border-line px-3 py-1">
                {r.toUpperCase()}
              </span>
            ))}
          </div>
        </div>

        <motion.ul
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        >
          {countries.map((c, i) => {
            const n = photosFor(c.slug).length;
            const clickable = n > 0;
            return (
              <motion.li
                key={c.slug}
                variants={{
                  hidden: { opacity: 0, scale: 0.6, rotate: -8 },
                  show: { opacity: 1, scale: 1, rotate: 0, transition: { type: "spring", stiffness: 260, damping: 18 } },
                }}
              >
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => open(c.slug)}
                  onMouseEnter={() => setHighlight(c.slug)}
                  onMouseLeave={() => setHighlight(null)}
                  className={`group relative aspect-square w-full rounded-xl border border-transparent p-2 transition-[border-color,transform] duration-300 ${
                    clickable ? "cursor-pointer hover:-translate-y-1 hover:border-line-2" : "cursor-default"
                  }`}
                  aria-label={clickable ? `${c.name}: open ${n} photos` : `${c.name}: no photos yet`}
                >
                  <Stamp slug={c.slug} name={c.name} iso={c.iso} region={c.region} index={i} />
                  <span className="absolute left-3 top-3 text-lg" aria-hidden>
                    {c.flag}
                  </span>
                  {c.home && (
                    <span className="absolute right-3 top-3 rounded-sm bg-gold px-1.5 py-0.5 font-mono text-[8px] tracking-[0.2em] text-ink">
                      HOME
                    </span>
                  )}
                  {clickable && (
                    <>
                      <span className="absolute bottom-3 left-3 rounded-sm bg-paper/90 px-1.5 py-0.5 font-mono text-[8px] tracking-[0.2em] text-ink">
                        {n} {n === 1 ? "PHOTO" : "PHOTOS"}
                      </span>
                      <span className="absolute bottom-3 right-3 font-mono text-[9px] tracking-[0.2em] text-fg-dim opacity-0 transition-opacity group-hover:opacity-100">
                        OPEN →
                      </span>
                    </>
                  )}
                </button>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>

      <Lightbox state={lightbox} onChange={setLightbox} />
    </section>
  );
}
