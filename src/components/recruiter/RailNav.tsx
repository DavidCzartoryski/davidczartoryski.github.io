"use client";

import { useEffect, useState } from "react";

export const SECTIONS = [
  ["overview", "Overview"],
  ["experience", "Experience"],
  ["ventures", "Ventures"],
  ["projects", "Projects"],
  ["education", "Education & skills"],
  ["contact", "Contact"],
] as const;

type Id = (typeof SECTIONS)[number][0];

/** The rail's table of contents; marks the section crossing the upper third of the screen. */
export default function RailNav({ className = "" }: { className?: string }) {
  const [active, setActive] = useState<Id>("overview");

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
      <ol className="space-y-0.5">
        {SECTIONS.map(([id, label], i) => {
          const on = id === active;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={on ? "location" : undefined}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition-colors ${
                  on ? "bg-cv-surface font-medium text-cv-fg" : "text-cv-muted hover:bg-cv-surface hover:text-cv-fg"
                }`}
              >
                <span className={`w-5 font-mono text-[11px] ${on ? "text-cv-accent" : "text-cv-faint"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {label}
                <span
                  aria-hidden
                  className={`ml-auto h-1.5 w-1.5 rounded-full bg-cv-accent transition-opacity ${on ? "opacity-100" : "opacity-0"}`}
                />
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
