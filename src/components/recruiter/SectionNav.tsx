"use client";

import { useEffect, useState } from "react";

export const SECTIONS = [
  ["about", "About"],
  ["experience", "Experience"],
  ["ventures", "Ventures"],
  ["projects", "Projects"],
  ["stack", "Stack"],
  ["education", "Education"],
  ["resume", "Résumé"],
  ["contact", "Contact"],
] as const;

type Id = (typeof SECTIONS)[number][0];

/** The header's section index; marks the section crossing the upper third of the screen. */
export default function SectionNav({ className = "" }: { className?: string }) {
  const [active, setActive] = useState<Id>("about");

  useEffect(() => {
    const els = SECTIONS.map(([id]) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id as Id);
      },
      { rootMargin: "-30% 0px -65% 0px" },
    );
    els.forEach((el) => io.observe(el));
    // The last section is too short to ever reach the band, so the bottom of the page claims it.
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) setActive("contact");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <nav aria-label="Sections" className={className}>
      <ol className="flex items-center gap-1">
        {SECTIONS.map(([id, label]) => {
          const on = id === active;
          return (
            <li key={id} className="shrink-0">
              <a
                href={`#${id}`}
                aria-current={on ? "location" : undefined}
                className={`block rounded-full px-3 py-1.5 text-[13.5px] transition-colors ${
                  on ? "text-cv-fg" : "text-cv-faint hover:text-cv-fg"
                }`}
              >
                {label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
