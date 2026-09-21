"use client";

import { useState } from "react";
import { layover, profile } from "@/data/site";
import countries from "@/data/countries.json";
import { allPhotos, findPhoto } from "@/lib/photos";
import Lightbox, { type LightboxState } from "../Lightbox";
import Reveal from "../Reveal";
import SectionHeader from "../SectionHeader";

const nameOf = new Map(countries.map((c) => [c.slug, c.name]));
const HERO = findPhoto("IMG_5090") ?? allPhotos[0];

export default function Layover() {
  const [lightbox, setLightbox] = useState<LightboxState>(null);

  return (
    <section id="layover" className="relative mx-auto max-w-7xl scroll-mt-24 px-6 py-28 md:py-36">
      <SectionHeader
        n="05"
        kicker="Layover"
        title={
          <>
            Off the clock, <em className="italic text-gold-2">on the road.</em>
          </>
        }
        blurb={layover.intro}
      />

      <div className="grid gap-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          {HERO && (
            <figure className="group relative overflow-hidden rounded-2xl">
              <img
                src={HERO.src}
                alt="David sitting on a rock above a valley in the Albanian Alps"
                className="aspect-[4/5] w-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04]"
                loading="lazy"
              />
              <figcaption className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-[linear-gradient(0deg,rgba(11,16,32,0.85),rgba(11,16,32,0))] p-5 font-mono text-[10px] tracking-[0.28em] text-paper">
                <span>{HERO.place.toUpperCase()}</span>
                <span>{profile.handle.toUpperCase()}</span>
              </figcaption>
            </figure>
          )}
        </Reveal>

        <div className="lg:col-span-7">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
            {layover.pillars.map((p, i) => (
              <Reveal key={p.key} delay={i * 0.07} className="bg-ink p-7">
                <div className="font-mono text-[10px] tracking-[0.3em] text-gold">0{i + 1}</div>
                <h3 className="mt-3 font-display text-3xl tracking-tight">{p.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">{p.body}</p>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-8 flex flex-wrap items-center gap-2">
            <span className="mr-2 font-mono text-[10px] tracking-[0.3em] text-fg-dim">ALSO IN THE BAG</span>
            {layover.extras.map((e) => (
              <span key={e} className="rounded-full border border-line px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-fg-muted">
                {e.toUpperCase()}
              </span>
            ))}
          </Reveal>

          <Reveal className="mt-8 flex flex-wrap gap-4">
            <a
              href={profile.instagram}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-3 rounded-full bg-paper px-5 py-3 font-mono text-[11px] font-semibold tracking-[0.25em] text-ink transition-transform hover:-translate-y-0.5"
            >
              INSTAGRAM {profile.handle.toUpperCase()} ↗
            </a>
            <a
              href={profile.tiktok}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-3 rounded-full border border-line-2 px-5 py-3 font-mono text-[11px] tracking-[0.25em] text-paper transition-colors hover:border-gold hover:text-gold"
            >
              TIKTOK {profile.handle.toUpperCase()} ↗
            </a>
          </Reveal>
        </div>
      </div>

      {/* film strip */}
      <Reveal className="mt-16">
        <div className="mb-4 flex items-center justify-between font-mono text-[10px] tracking-[0.3em] text-fg-dim">
          <span>CONTACT SHEET · {allPhotos.length} FRAMES</span>
          <span>SCROLL →</span>
        </div>
        <div className="no-scrollbar -mx-6 flex gap-3 overflow-x-auto px-6 pb-4">
          {allPhotos.map((p, i) => (
            <button
              key={p.src}
              type="button"
              onClick={() =>
                setLightbox({
                  photos: allPhotos,
                  index: i,
                  title: nameOf.get(p.country) ?? p.country,
                })
              }
              className="group relative h-40 shrink-0 overflow-hidden rounded-lg border border-line md:h-52"
              aria-label={`Open photo from ${p.place}`}
            >
              <img
                src={p.thumb}
                alt={p.place}
                className="h-full w-auto object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <span className="absolute bottom-2 left-2 rounded-sm bg-ink/70 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.2em] text-paper opacity-0 transition-opacity group-hover:opacity-100">
                {p.place.toUpperCase()}
              </span>
            </button>
          ))}
        </div>
      </Reveal>

      <Lightbox state={lightbox} onChange={setLightbox} />
    </section>
  );
}
