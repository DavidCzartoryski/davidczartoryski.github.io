import { artemis, mailto } from "@/data/artemis";
import CopyEmail from "@/components/recruiter/CopyEmail";
import { Arrow, Container, Eyebrow, button } from "./bits";

const { feedback } = artemis;

export default function Feedback() {
  return (
    <section id="feedback" aria-labelledby="feedback-title" className="border-t border-ar-line py-20 md:py-32">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <Eyebrow n="09">{feedback.eyebrow}</Eyebrow>
            <h2 id="feedback-title" className="ar-display mt-6 text-[clamp(2.4rem,5.4vw,4.6rem)] leading-[0.98] text-ar-fg">
              {feedback.heading}
            </h2>
            <p className="mt-6 max-w-[520px] text-[17px] leading-[1.65] text-ar-muted">{feedback.body}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href={mailto(`${artemis.name}: feedback`)} className={button.solid}>
                Email David
                <Arrow className="transition-transform group-hover:translate-x-0.5" />
              </a>
              <a href={artemis.github} className={button.line}>
                GPUBridge on GitHub
              </a>
              <a href={artemis.linkedin} className={button.line}>
                LinkedIn
              </a>
            </div>
            <CopyEmail
              email={artemis.email}
              label={["Copy", "Copied ✓"]}
              className="ar-mono mt-5 inline-flex items-center gap-2 py-2 text-[12px] text-ar-faint transition-colors hover:text-ar-fg"
            >
              <span>{artemis.email} ·</span>
            </CopyEmail>
          </div>
          <div className="lg:col-span-6">
            <p className="ar-label text-ar-faint">Questions I&apos;d love answered</p>
            <ol className="mt-5 border-t border-ar-line">
              {feedback.questions.map((q, i) => (
                <li key={q} className="grid grid-cols-[40px_1fr] border-b border-ar-line py-4">
                  <span className="ar-mono pt-0.5 text-[11px] text-ar-faint">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[16px] leading-[1.55] text-ar-fg">{q}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-[14.5px] leading-[1.6] text-ar-muted">{feedback.note}</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
