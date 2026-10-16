import Link from "next/link";
import { profile } from "@/data/site";
import Plane from "../Plane";
import CopyEmail from "./CopyEmail";
import RailNav from "./RailNav";

const outline =
  "inline-flex h-10 items-center justify-center gap-1 rounded-lg text-[13px] font-medium text-cv-fg ring-1 ring-inset ring-cv-line-2 transition-colors hover:bg-cv-surface";

/**
 * Who, what, and how to reach him. On wide screens it stays put beside the
 * page with the section index; below that it is simply the page's header.
 */
export default function Rail() {
  return (
    <aside className="border-b border-cv-line px-6 pb-10 pt-10 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[340px] lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-8 lg:pb-7 lg:pt-8 xl:w-[380px] xl:px-10">
      <div className="no-print hidden items-center justify-between lg:flex">
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cv-fg text-[13px] font-semibold tracking-[-0.02em] text-cv-bg">
            DC
          </span>
          <span className="text-[13px] font-medium text-cv-muted">Recruiter view</span>
        </span>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-cv-muted transition-colors hover:text-cv-fg"
        >
          <Plane size={12} /> Full site
        </Link>
      </div>

      <div className="lg:mt-[max(2rem,5vh)]">
        <h1 className="text-[clamp(2.4rem,9vw,2.9rem)] font-semibold leading-[1] tracking-[-0.04em] lg:text-[2.6rem] xl:text-[2.9rem]">
          {profile.name}
        </h1>
        <p className="mt-3 text-[17px] font-medium tracking-[-0.01em] text-cv-fg">{profile.role}</p>
        <p className="mt-1 text-[15px] text-cv-muted">
          Northeastern · Graduating {profile.graduation}
        </p>
        <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-cv-ok-soft px-3 py-1.5 text-[13px] font-medium text-cv-ok">
          <span aria-hidden className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cv-ok opacity-50 motion-reduce:hidden" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cv-ok" />
          </span>
          Open to new-grad SWE roles
        </p>
      </div>

      <RailNav className="no-print -mx-3 mt-8 hidden lg:block" />

      <div className="mt-8 lg:mt-auto lg:pt-8">
        <a
          href={profile.resume}
          target="_blank"
          rel="noopener"
          className="no-print flex h-11 items-center justify-center gap-2 rounded-lg bg-cv-accent text-[14px] font-semibold text-white transition-[filter] hover:brightness-110 dark:text-cv-bg"
        >
          Download résumé <span aria-hidden>↓</span>
        </a>
        <div className="no-print mt-2 grid grid-cols-3 gap-2">
          <a href={`mailto:${profile.email}`} className={outline}>
            Email
          </a>
          <a href={profile.linkedin} target="_blank" rel="noopener" className={outline}>
            LinkedIn <span aria-hidden className="text-cv-faint">↗</span>
          </a>
          <a href={profile.github} target="_blank" rel="noopener" className={outline}>
            GitHub <span aria-hidden className="text-cv-faint">↗</span>
          </a>
        </div>
        <CopyEmail
          email={profile.email}
          label={["Copy", "Copied ✓"]}
          className="group mt-2 flex h-10 w-full items-center justify-between gap-3 rounded-lg bg-cv-surface px-3.5 text-left text-[12.5px] font-medium text-cv-accent transition-colors hover:bg-cv-accent-soft"
        >
          <span className="truncate font-mono text-[12px] font-normal text-cv-muted group-hover:text-cv-fg">
            {profile.email}
          </span>
        </CopyEmail>
      </div>
    </aside>
  );
}
