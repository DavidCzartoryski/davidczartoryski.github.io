import Link from "next/link";
import { profile } from "@/data/site";
import Plane from "../Plane";

const SECTIONS = [
  ["experience", "Experience"],
  ["ventures", "Ventures"],
  ["education", "Education"],
  ["skills", "Skills"],
  ["contact", "Contact"],
];

export default function TopBar() {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-6">
        <a href="#top" className="flex items-center gap-3" aria-label="Back to top">
          <span className="font-display text-xl leading-none tracking-tight">DC</span>
          <span className="hidden font-mono text-[10px] tracking-[0.3em] text-ink/55 sm:inline">RECRUITER VIEW</span>
        </a>

        <nav aria-label="Sections" className="hidden items-center gap-6 lg:flex">
          {SECTIONS.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink/60 transition-colors hover:text-ink"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex h-9 items-center gap-2 rounded-full border border-ink/20 px-3.5 font-mono text-[11px] tracking-[0.2em] text-ink/75 transition-colors hover:border-ink hover:text-ink"
          >
            <Plane size={12} />
            <span className="sm:hidden">FULL SITE</span>
            <span className="hidden sm:inline">FULL EXPERIENCE</span>
          </Link>
          <a
            href={profile.resume}
            target="_blank"
            rel="noopener"
            className="inline-flex h-9 items-center gap-2 rounded-full bg-ink px-4 font-mono text-[11px] tracking-[0.2em] text-paper transition-colors hover:bg-ink-3"
          >
            RÉSUMÉ PDF <span aria-hidden>↓</span>
          </a>
        </div>
      </div>
    </header>
  );
}
