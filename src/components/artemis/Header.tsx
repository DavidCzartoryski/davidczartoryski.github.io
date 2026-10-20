import Link from "next/link";
import { artemis, artemisNav, mailto } from "@/data/artemis";
import Mark from "./Mark";

/** Wordmark, the section index from md up, and the one call to action. */
export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-ar-line bg-ar-bg/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-6 px-5 md:px-10">
        <a href="#top" className="flex items-center gap-2.5 text-ar-ink" aria-label="Artemis, back to top">
          <Mark size={26} />
          <span className="ar-wide text-[15px] font-semibold tracking-[0.16em]">ARTEMIS</span>
        </a>
        <nav aria-label="Sections" className="ml-auto hidden md:block">
          <ul className="flex items-center gap-1">
            {artemisNav.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="rounded-full px-3 py-2 text-[13.5px] text-ar-muted transition-colors hover:text-ar-ink"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link
            href="/"
            className="hidden rounded-full px-3 py-2 text-[13.5px] text-ar-faint transition-colors hover:text-ar-ink lg:inline"
          >
            davidczartoryski.com
          </Link>
          <a
            href={mailto(`${artemis.name}: design partner`)}
            className="inline-flex h-9 items-center rounded-full bg-ar-ink px-4 text-[13.5px] font-medium text-ar-bg transition-opacity hover:opacity-85"
          >
            Talk to us
          </a>
        </div>
      </div>
    </header>
  );
}
