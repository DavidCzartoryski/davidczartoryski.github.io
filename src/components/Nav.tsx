"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { navItems, profile } from "@/data/site";
import { useIntro } from "./IntroContext";
import AudioButton from "./AudioButton";
import Plane from "./Plane";

export default function Nav() {
  const { done } = useIntro();
  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50"
      initial={{ y: -24, opacity: 0 }}
      animate={done ? { y: 0, opacity: 1 } : { y: -24, opacity: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="border-b border-line bg-ink/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6">
          <Link href="#top" className="flex items-center gap-3" aria-label="Back to top">
            <span className="font-display text-2xl leading-none tracking-tight">DC</span>
            <span className="hidden font-mono text-[10px] tracking-[0.32em] text-fg-dim sm:inline">
              CZARTORYSKI / DAVID
            </span>
          </Link>

          <nav aria-label="Sections" className="no-scrollbar hidden items-center gap-6 overflow-x-auto md:flex">
            {navItems.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                className="group flex items-center gap-2 whitespace-nowrap font-mono text-[11px] tracking-[0.22em] text-fg-dim transition-colors hover:text-paper"
              >
                <span className="text-gold/80">{n.n}</span>
                <span className="uppercase">{n.label}</span>
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <AudioButton />
            <a
              href={profile.resume}
              target="_blank"
              rel="noopener"
              className="hidden items-center gap-2 rounded-full border border-gold/50 px-4 py-2 font-mono text-[11px] tracking-[0.22em] text-gold transition-colors hover:bg-gold hover:text-ink sm:inline-flex"
            >
              RÉSUMÉ <Plane size={12} />
            </a>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
