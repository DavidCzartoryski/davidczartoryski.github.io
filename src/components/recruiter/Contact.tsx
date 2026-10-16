import Link from "next/link";
import { profile } from "@/data/site";
import Plane from "../Plane";
import CopyEmail from "./CopyEmail";

const YEAR = new Date().getFullYear();

const rows = [
  { k: "Email", v: profile.email, href: `mailto:${profile.email}` },
  { k: "LinkedIn", v: "linkedin.com/in/david-czartoryski", href: profile.linkedin },
  { k: "GitHub", v: "github.com/DavidCzartoryski", href: profile.github },
  { k: "Résumé", v: "DavidCzartoryski_Resume.pdf", href: profile.resume },
];

export default function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-h" className="scroll-mt-24 pt-24">
      <div className="cv-inv grid gap-10 rounded-2xl bg-cv-inv p-7 text-cv-inv-fg ring-1 ring-cv-inv-line md:p-10">
        <div>
          <div className="font-mono text-[12px] text-cv-inv-accent">06</div>
          <h2 id="contact-h" className="mt-3 text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-none tracking-[-0.04em]">
            Let&rsquo;s talk.
          </h2>
          <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-cv-inv-muted">
            Graduating in December 2027 and interviewing for new-grad software engineering roles. Email is the fastest
            way to reach me.
          </p>
          <div className="no-print mt-7 flex flex-wrap items-center gap-2.5">
            <a
              href={`mailto:${profile.email}`}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-cv-inv-fg px-5 text-[14px] font-semibold text-cv-inv transition-opacity hover:opacity-90"
            >
              Send a message →
            </a>
            <CopyEmail
              email={profile.email}
              label={["Copy email", "Copied ✓"]}
              className="inline-flex h-11 items-center rounded-lg px-4 text-[14px] font-medium text-cv-inv-fg ring-1 ring-inset ring-cv-inv-line transition-colors hover:bg-white/[0.06]"
            />
          </div>
        </div>

        <ul className="overflow-hidden rounded-xl ring-1 ring-cv-inv-line">
          {rows.map((r) => (
            <li key={r.k} className="border-b border-cv-inv-line last:border-b-0">
              <a
                href={r.href}
                target={r.href.startsWith("mailto:") ? undefined : "_blank"}
                rel="noopener"
                className="group grid grid-cols-[72px_1fr_auto] sm:grid-cols-[96px_1fr_auto] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.04]"
              >
                <span className="text-[13px] text-cv-inv-muted">{r.k}</span>
                <span className="truncate font-mono text-[13px] text-cv-inv-fg">{r.v}</span>
                <span
                  aria-hidden
                  className="text-[13px] text-cv-inv-muted transition-transform group-hover:translate-x-0.5 group-hover:text-cv-inv-fg"
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
    <footer className="flex flex-col gap-3 pb-10 pt-8 text-[13px] text-cv-faint sm:flex-row sm:items-center sm:justify-between">
      <span>
        © {YEAR} {profile.name}
      </span>
      <Link
        href="/"
        className="no-print inline-flex items-center gap-2 text-cv-muted underline-offset-4 hover:text-cv-fg hover:underline"
      >
        Prefer the scenic route? Take the full experience <Plane size={12} />
      </Link>
    </footer>
  );
}
