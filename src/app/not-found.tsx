import Link from "next/link";
import { profile } from "@/data/site";

// GitHub Pages is case-sensitive and answers any missing path with out/404.html.
// The Artemis page lives at /Artemis/, so /artemis, /ARTEMIS/ and other casings
// are sent there before anything paints, keeping the rest of the path, the
// query and the hash. A real miss under /Artemis/ maps to itself, so it stops
// here and shows the 404 instead of looping.
const ARTEMIS_REDIRECT = `(function(){var p=location.pathname,l=p.toLowerCase();if(l!=="/artemis"&&l.indexOf("/artemis/")!==0)return;var t="/Artemis"+(p.slice(8)||"/");if(t===p)return;document.documentElement.style.visibility="hidden";location.replace(t+location.search+location.hash)})()`;

export default function NotFound() {
  return (
    <>
      <title>{`Page not found · ${profile.name}`}</title>
      <script dangerouslySetInnerHTML={{ __html: ARTEMIS_REDIRECT }} />
      <main className="flex min-h-screen items-center px-6 py-24">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-6 flex items-center gap-4 font-mono text-[11px] tracking-[0.3em] text-fg-dim">
            <span className="text-gold">404</span>
            <span className="h-px w-10 bg-line-2" />
            <span>PAGE NOT FOUND</span>
          </div>
          <h1 className="font-display text-[length:var(--step-h2)] leading-[0.98] tracking-[-0.02em]">
            No flight to <em className="italic text-gold-2">this page.</em>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-fg-muted">
            The link may be mistyped, or the page has moved.
          </p>
          <Link
            href="/"
            className="mt-10 inline-flex items-center gap-3 rounded-full border border-line-2 px-7 py-4 font-mono text-[12px] font-semibold tracking-[0.28em] text-paper transition-colors hover:border-gold hover:text-gold"
          >
            ← BACK TO THE PASSPORT
          </Link>
        </div>
      </main>
    </>
  );
}
