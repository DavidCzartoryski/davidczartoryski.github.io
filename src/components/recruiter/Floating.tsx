"use client";

import { useEffect, useState } from "react";
import { ArrowUp, Download } from "./icons";

/** Bottom right, always in reach: the PDF, and a way back up once you are deep in. */
export default function Floating({ resume }: { resume: string }) {
  const [deep, setDeep] = useState(false);

  useEffect(() => {
    const onScroll = () => setDeep(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="no-print fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <a
        href="#top"
        aria-label="Back to top"
        tabIndex={deep ? undefined : -1}
        aria-hidden={!deep}
        className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-cv-line-2 bg-cv-bg/80 text-cv-fg backdrop-blur-md transition duration-300 hover:border-cv-fg/30 ${
          deep ? "opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        <ArrowUp size={16} />
      </a>
      <a
        href={resume}
        target="_blank"
        rel="noopener"
        className="inline-flex h-11 items-center gap-2.5 rounded-full bg-cv-accent pl-4 pr-5 text-[13.5px] sm:h-12 sm:text-[14px] font-medium text-cv-accent-ink shadow-[0_10px_30px_-8px_rgb(242_169_59/0.55)] transition-[filter] hover:brightness-110"
      >
        <Download size={16} /> Résumé
        <span className="font-cv-mono text-[10.5px] tracking-[0.12em] text-cv-accent-ink/60">PDF</span>
      </a>
    </div>
  );
}
