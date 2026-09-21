"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { cargo, profile } from "@/data/site";
import { useIntro } from "../IntroContext";
import Plane from "../Plane";
import SplitFlap from "../SplitFlap";

const DESTINATIONS = [
  ["WAW", "WARSAW"],
  ["MXP", "MILAN"],
  ["SFO", "SAN FRANCISCO"],
  ["IST", "ISTANBUL"],
  ["DXB", "DUBAI"],
  ["TIA", "TIRANA"],
  ["ATH", "ATHENS"],
];

const parent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.35 } },
};
const child = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function Hero() {
  const { done } = useIntro();
  return (
    <section id="top" className="relative min-h-[100svh] overflow-hidden">
      {/* pre-dawn window seat */}
      <div aria-hidden className="absolute inset-0">
        <img
          src="/art/night-flight.webp"
          alt=""
          className="h-full w-full object-cover object-[70%_60%]"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,16,32,0.92)_0%,rgba(11,16,32,0.7)_38%,rgba(11,16,32,0.15)_70%,rgba(11,16,32,0.05)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-[linear-gradient(180deg,rgba(11,16,32,0)_0%,var(--ink)_100%)]" />
      </div>

      <motion.div
        variants={parent}
        initial="hidden"
        animate={done ? "show" : "hidden"}
        className="relative z-10 mx-auto grid max-w-7xl gap-14 px-6 pb-24 pt-36 lg:grid-cols-12 lg:items-end lg:pt-44"
      >
        <div className="lg:col-span-7">
          <motion.div variants={child} className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] tracking-[0.3em] text-fg-dim">
            <span className="text-gold">PASSPORT NO. DC-2027</span>
            <span className="h-px w-8 bg-line-2" />
            <span>ISSUED BOSTON, MA</span>
            <span className="h-px w-8 bg-line-2" />
            <span>VALID WORLDWIDE</span>
          </motion.div>

          <motion.h1 variants={child} className="font-display text-[length:var(--step-display)] leading-[0.9] tracking-[-0.03em]">
            {profile.first}
            <br />
            <em className="font-normal italic text-gold-2">{profile.last}</em>
          </motion.h1>

          <motion.p variants={child} className="mt-8 max-w-xl text-[17px] leading-relaxed text-fg-muted md:text-[19px]">
            Software engineer and founder out of Northeastern. Wrestler by trade, Polish at home,
            Bostonian by zip code. Twenty-three countries stamped, and the next flight is a new-grad
            engineering role in May 2027.
          </motion.p>

          <motion.div variants={child} className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#passport"
              className="group inline-flex items-center gap-3 rounded-full bg-paper px-6 py-3.5 font-mono text-[12px] font-semibold tracking-[0.25em] text-ink transition-transform hover:-translate-y-0.5"
            >
              OPEN PASSPORT
              <span className="transition-transform group-hover:translate-y-0.5">↓</span>
            </a>
            <a
              href={profile.resume}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-3 rounded-full border border-line-2 px-6 py-3.5 font-mono text-[12px] tracking-[0.25em] text-paper transition-colors hover:border-gold hover:text-gold"
            >
              RÉSUMÉ (PDF)
            </a>
          </motion.div>
        </div>

        <motion.div variants={child} className="lg:col-span-5">
          <BoardingPass />
        </motion.div>

        <motion.dl
          variants={child}
          className="grid grid-cols-2 gap-6 border-t border-line pt-8 font-mono lg:col-span-12 lg:grid-cols-4"
        >
          {[
            ["23", "COUNTRIES STAMPED"],
            [String(profile.bases.length).padStart(2, "0"), "HOME BASES"],
            ["1ST", "MA STATE CHAMPION, MULTIPLE TITLES"],
            [String(cargo.length).padStart(2, "0"), "VENTURES IN THE HOLD"],
          ].map(([v, k]) => (
            <div key={k}>
              <dt className="order-2 text-[10px] tracking-[0.28em] text-fg-dim">{k}</dt>
              <dd className="font-display text-4xl leading-none tracking-tight text-paper md:text-5xl">{v}</dd>
            </div>
          ))}
        </motion.dl>
      </motion.div>
    </section>
  );
}

function BoardingPass() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % DESTINATIONS.length), 3200);
    return () => clearInterval(id);
  }, []);
  const [code, city] = DESTINATIONS[i];

  return (
    <div className="paper relative overflow-hidden rounded-2xl shadow-[0_40px_90px_-30px_rgba(0,0,0,0.85)] lg:-rotate-2">
      <div className="flex items-center justify-between border-b border-ink/15 px-5 py-3 font-mono text-[10px] tracking-[0.3em] text-ink/70">
        <span>BOARDING PASS</span>
        <span className="flex items-center gap-2">
          <Plane size={13} /> HERCULES AIR
        </span>
      </div>
      <div className="px-5 pb-5 pt-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] tracking-[0.25em] text-ink/55">FROM</div>
            <div className="font-display text-5xl leading-none tracking-tight text-ink">BOS</div>
            <div className="mt-1 font-mono text-[10px] tracking-[0.15em] text-ink/60">BOSTON</div>
          </div>
          <div className="mb-6 flex flex-1 items-center gap-2 px-1 text-ink/50">
            <span className="h-px flex-1 border-t border-dashed border-ink/40" />
            <Plane size={16} />
            <span className="h-px flex-1 border-t border-dashed border-ink/40" />
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] tracking-[0.25em] text-ink/55">TO</div>
            <div className="text-paper">
              <SplitFlap value={code} className="text-[2.1rem] leading-none" />
            </div>
            <div className="mt-1 font-mono text-[10px] tracking-[0.15em] text-ink/60">{city}</div>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-3 gap-x-3 gap-y-3 border-t border-dashed border-ink/25 pt-4 font-mono text-ink">
          {[
            ["PASSENGER", "CZARTORYSKI / D"],
            ["FLIGHT", "HH 2027"],
            ["GATE", "23"],
            ["SEAT", "1A"],
            ["CLASS", "FOUNDER"],
            ["DEPARTS", "MAY 2027"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[9px] tracking-[0.25em] text-ink/55">{k}</dt>
              <dd className="mt-0.5 text-[12px] font-semibold tracking-[0.06em]">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="barcode mt-5 h-10 w-full opacity-75" />
      </div>
    </div>
  );
}
