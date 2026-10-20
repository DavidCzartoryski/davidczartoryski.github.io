import Link from "next/link";
import { artemis, mailto } from "@/data/artemis";
import CopyEmail from "@/components/recruiter/CopyEmail";
import { Arrow, Container } from "./bits";
import Mark from "./Mark";

const { contact } = artemis;

export default function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="bg-ar-night py-20 text-ar-night-fg md:py-32">
      <Container>
        <h2 id="contact-title" className="ar-display max-w-[980px] text-[clamp(2.4rem,6vw,5.4rem)] leading-[0.95]">
          {contact.heading} <span className="text-ar-night-signal">{contact.mark}</span>
        </h2>
        <p className="mt-8 max-w-[560px] text-[17px] leading-[1.65] text-ar-night-muted">{contact.body}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href={mailto(`${artemis.name}: design partner`)}
            className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-ar-night-fg px-6 text-[15px] font-medium text-ar-night transition-opacity hover:opacity-85"
          >
            Become a design partner
            <Arrow className="transition-transform group-hover:translate-x-0.5" />
          </a>
          <a
            href={mailto(`${artemis.name}: investor intro`)}
            className="inline-flex h-12 items-center rounded-full border border-ar-night-fg/30 px-6 text-[15px] font-medium transition-colors hover:border-ar-night-fg/70"
          >
            Investor inquiries
          </a>
          <CopyEmail
            email={artemis.email}
            label={["Copy email", "Copied ✓"]}
            className="ar-mono inline-flex h-12 items-center gap-2 rounded-full px-4 text-[12px] text-ar-night-faint transition-colors hover:text-ar-night-fg"
          >
            <span className="hidden sm:inline">{artemis.email} ·</span>
          </CopyEmail>
        </div>
      </Container>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-ar-night text-ar-night-faint">
      <Container className="flex flex-col gap-6 border-t border-ar-night-line py-10 text-[13px] md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 text-ar-night-fg">
          <Mark size={22} />
          <span className="ar-wide text-[13px] font-semibold tracking-[0.16em]">ARTEMIS</span>
          <span className="text-ar-night-faint">© {new Date().getFullYear()}</span>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          <li>
            <a href={artemis.github} className="transition-colors hover:text-ar-night-fg">
              GPUBridge
            </a>
          </li>
          <li>
            <Link href="/recruiter/" className="transition-colors hover:text-ar-night-fg">
              {"David's résumé"}
            </Link>
          </li>
          <li>
            <Link href="/" className="transition-colors hover:text-ar-night-fg">
              davidczartoryski.com
            </Link>
          </li>
        </ul>
      </Container>
    </footer>
  );
}
