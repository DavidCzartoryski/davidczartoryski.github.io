import Link from "next/link";
import { profile } from "@/data/site";
import Plane from "../Plane";
import CopyEmail from "./CopyEmail";

const YEAR = new Date().getFullYear();

const rows = [
  { k: "EMAIL", v: profile.email, href: `mailto:${profile.email}` },
  { k: "LINKEDIN", v: "linkedin.com/in/david-czartoryski", href: profile.linkedin },
  { k: "GITHUB", v: "github.com/DavidCzartoryski", href: profile.github },
  { k: "RÉSUMÉ", v: "DavidCzartoryski_Resume.pdf", href: profile.resume },
];

export default function Contact() {
  return (
    <section id="contact" className="mx-auto max-w-6xl px-6 pb-10">
      <div className="grid gap-10 rounded-3xl bg-ink p-8 text-paper md:p-12 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-6">
          <div className="font-mono text-[11px] tracking-[0.3em] text-gold">CONTACT</div>
          <h2 className="mt-4 font-display text-[clamp(2.4rem,5vw,4rem)] leading-[0.95] tracking-[-0.02em]">
            Let&rsquo;s <em className="italic text-gold-2">talk.</em>
          </h2>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed text-fg-muted">
            Graduating in December 2027 and interviewing for new-grad software engineering roles. Email is the fastest
            way to reach me.
          </p>
          <div className="no-print mt-8 flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${profile.email}`}
              className="inline-flex h-11 items-center gap-3 rounded-full bg-gold px-6 font-mono text-[11px] font-semibold tracking-[0.25em] text-ink transition-transform hover:-translate-y-0.5"
            >
              SEND A MESSAGE →
            </a>
            <CopyEmail
              email={profile.email}
              className="inline-flex h-11 items-center rounded-full border border-line-2 px-5 font-mono text-[11px] tracking-[0.22em] text-paper transition-colors hover:border-paper"
            />
          </div>
        </div>

        <ul className="overflow-hidden rounded-2xl border border-line lg:col-span-6">
          {rows.map((r) => (
            <li key={r.k} className="border-b border-line last:border-b-0">
              <a
                href={r.href}
                target={r.href.startsWith("mailto:") ? undefined : "_blank"}
                rel="noopener"
                className="group grid grid-cols-[88px_1fr_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-ink-2"
              >
                <span className="font-mono text-[10px] tracking-[0.3em] text-gold">{r.k}</span>
                <span className="truncate font-mono text-[13px] tracking-[0.04em] text-paper">{r.v}</span>
                <span
                  aria-hidden
                  className="font-mono text-[12px] text-fg-dim transition-transform group-hover:translate-x-1 group-hover:text-paper"
                >
                  →
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto flex max-w-6xl flex-col gap-3 px-6 pb-10 pt-2 font-mono text-[10px] tracking-[0.25em] text-ink/55 sm:flex-row sm:items-center sm:justify-between">
      <span>
        © {YEAR} {profile.name.toUpperCase()} · RECRUITER VIEW
      </span>
      <Link
        href="/"
        className="no-print inline-flex items-center gap-2 text-gold-deep underline-offset-4 hover:text-ink hover:underline"
      >
        PREFER THE SCENIC ROUTE? TAKE THE FULL EXPERIENCE <Plane size={11} />
      </Link>
    </footer>
  );
}
