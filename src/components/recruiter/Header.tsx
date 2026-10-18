import Link from "next/link";
import { profile } from "@/data/site";
import CopyEmail from "./CopyEmail";
import { ArrowLeft, Mail } from "./icons";
import SectionNav from "./SectionNav";

const pill =
  "inline-flex h-9 items-center gap-2 rounded-full border border-cv-line-2 bg-white/[0.02] px-3.5 text-[12.5px] text-cv-muted transition-colors hover:border-cv-fg/30 hover:text-cv-fg";

/** One row from lg up: way back, the section index, email. Below that the index gets its own row. */
export default function Header() {
  return (
    <header className="no-print sticky top-0 z-50 border-b border-cv-line bg-cv-bg/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center px-3 sm:px-4 lg:flex-nowrap">
        <div className="flex h-14 min-w-0 items-center gap-3 lg:flex-1">
          <Link href="/" className={pill} aria-label="Back to the full site">
            <ArrowLeft size={13} />
            <span className="hidden sm:inline">Full site</span>
          </Link>
          <a href="#top" className="truncate text-[15px] font-medium tracking-[-0.01em] text-cv-fg">
            {profile.name}
          </a>
        </div>
        <div className="ml-auto flex h-14 items-center lg:order-last lg:ml-0 lg:flex-1 lg:justify-end">
          <CopyEmail email={profile.email} label={["Copy email", "Copied ✓"]} className={pill}>
            <Mail size={13} />
          </CopyEmail>
        </div>
        <SectionNav className="no-scrollbar order-last -mx-3 w-[calc(100%+1.5rem)] overflow-x-auto border-t border-cv-line px-1.5 py-1.5 sm:-mx-4 sm:w-[calc(100%+2rem)] lg:order-none lg:mx-0 lg:w-auto lg:border-0 lg:p-0" />
      </div>
    </header>
  );
}
