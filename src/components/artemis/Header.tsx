import Link from "next/link";
import Mark from "./Mark";
import SectionNav from "./SectionNav";

/** Wordmark, the section index, and the one call to action: feedback. */
export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-ar-line bg-ar-bg/80 backdrop-blur-xl">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-10 focus:rounded-full focus:bg-ar-fg focus:px-4 focus:py-2 focus:text-[13px] focus:text-ar-bg"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-6 px-5 md:px-10">
        <a href="#top" className="flex shrink-0 items-center gap-2.5 text-ar-fg" aria-label="Artemis, back to top">
          <Mark size={26} />
          <span className="ar-wide text-[15px] font-semibold tracking-[0.16em]">ARTEMIS</span>
        </a>
        <nav aria-label="Sections" className="ml-auto hidden lg:block">
          <SectionNav variant="bar" />
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Link
            href="/"
            className="hidden rounded-full px-3 py-2 text-[13.5px] text-ar-faint transition-colors hover:text-ar-fg xl:inline"
          >
            davidczartoryski.com
          </Link>
          <a
            href="#feedback"
            className="inline-flex h-9 items-center rounded-full bg-ar-fg px-4 text-[13.5px] font-medium text-ar-bg transition-opacity hover:opacity-85"
          >
            Send feedback
          </a>
        </div>
      </div>
      <nav aria-label="Sections" className="border-t border-ar-line lg:hidden">
        <SectionNav variant="row" />
      </nav>
    </header>
  );
}
