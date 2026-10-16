import Link from "next/link";
import { profile } from "@/data/site";
import Plane from "../Plane";

/** Narrow screens only; from lg up the rail carries all of this. */
export default function TopBar() {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-cv-line bg-cv-bg/85 backdrop-blur-md lg:hidden">
      <div className="flex h-14 items-center justify-between gap-4 px-6">
        <a href="#top" className="flex items-center gap-2.5" aria-label="Back to top">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-cv-fg text-[12px] font-semibold tracking-[-0.02em] text-cv-bg">
            DC
          </span>
          <span className="text-[13px] font-medium text-cv-muted">Recruiter view</span>
        </a>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-cv-fg ring-1 ring-inset ring-cv-line-2 transition-colors hover:bg-cv-surface"
          >
            <Plane size={12} /> Full site
          </Link>
          <a
            href={profile.resume}
            target="_blank"
            rel="noopener"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-cv-accent px-3.5 text-[13px] font-semibold text-white transition-[filter] hover:brightness-110 dark:text-cv-bg"
          >
            Résumé <span aria-hidden>↓</span>
          </a>
        </div>
      </div>
    </header>
  );
}
