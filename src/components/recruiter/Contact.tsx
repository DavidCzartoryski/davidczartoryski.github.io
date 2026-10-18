import Link from "next/link";
import { profile } from "@/data/site";
import Plane from "../Plane";
import CopyEmail from "./CopyEmail";
import { SectionHead } from "./bits";
import { GitHub, LinkedIn, Mail, Pin } from "./icons";

const YEAR = new Date().getFullYear();

const circle =
  "inline-flex h-11 w-11 items-center justify-center rounded-full border border-cv-line-2 bg-white/[0.02] text-cv-fg transition-colors hover:border-cv-fg/30 hover:bg-white/[0.05]";

export default function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-h" className="scroll-mt-28 pb-16 pt-32 text-center md:pb-24 md:pt-44">
      <SectionHead id="contact" n="08" kicker="Contact" title="Let's talk" center />
      <p className="mx-auto -mt-4 max-w-md text-balance text-[15.5px] leading-relaxed text-cv-muted">
        Graduating in December 2027 and interviewing for new-grad software engineering roles. Email is the fastest way
        to reach me.
      </p>
      <div className="mt-9 flex flex-col items-center gap-4">
        <a
          href={`mailto:${profile.email}`}
          className="inline-flex h-[52px] items-center gap-3 rounded-full bg-cv-fg px-7 text-[15px] font-medium text-cv-bg transition-opacity hover:opacity-90"
        >
          <Mail size={16} /> {profile.email}
        </a>
        <div className="no-print flex items-center gap-3">
          <a href={profile.github} target="_blank" rel="noopener" aria-label="GitHub" className={circle}>
            <GitHub size={16} />
          </a>
          <a href={profile.linkedin} target="_blank" rel="noopener" aria-label="LinkedIn" className={circle}>
            <LinkedIn size={16} />
          </a>
          <CopyEmail
            email={profile.email}
            label={["Copy email", "Copied ✓"]}
            className="inline-flex h-11 items-center rounded-full border border-cv-line-2 bg-white/[0.02] px-4 text-[13px] text-cv-muted transition-colors hover:border-cv-fg/30 hover:text-cv-fg"
          />
        </div>
        <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-cv-faint">
          <Pin size={13} /> {profile.bases.map((b) => b.city).join(" · ")}
        </p>
        <p className="hidden text-[13px] text-cv-muted print:block">
          linkedin.com/in/david-czartoryski · github.com/DavidCzartoryski
        </p>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-cv-line">
      {/* Bottom padding keeps the floating résumé button off the links. */}
      <div className="mx-auto flex max-w-[1152px] flex-col gap-3 px-6 pb-28 pt-8 text-[13px] text-cv-faint sm:flex-row sm:items-center sm:justify-between md:px-10">
        <span>
          © {YEAR} {profile.name}
        </span>
        <Link
          href="/"
          className="no-print inline-flex items-center gap-2 text-cv-muted underline-offset-4 hover:text-cv-fg hover:underline"
        >
          Prefer the scenic route? Take the full experience <Plane size={12} />
        </Link>
      </div>
    </footer>
  );
}
