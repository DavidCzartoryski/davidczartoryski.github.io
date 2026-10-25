import Link from "next/link";
import { mailto } from "@/data/artemis";
import { Arrow, Container, button } from "./bits";

const benefits = [
  { title: "Recover GPU time.", body: "Find the bottlenecks that leave expensive hardware waiting instead of training." },
  { title: "Give engineers time back.", body: "Bring detection, investigation, and recovery into one workflow—not another dashboard to watch." },
  { title: "Know the fix worked.", body: "Measure useful training throughput after an intervention, not just whether an alert disappeared." },
];

export default function Homepage() {
  return (
    <>
      <section aria-labelledby="value-title" className="border-t border-ar-line py-16 md:py-24">
        <Container>
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-16">
            <h2 id="value-title" className="ar-display max-w-[500px] text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.12]">Your GPUs are expensive.<br />So is your team&apos;s time.</h2>
            <p className="max-w-[520px] self-center text-[17px] leading-[1.7] text-ar-muted">One slow GPU can hold back an entire training job. Artemis is being built to find the cause, take permitted action, and verify recovery—so your team can focus on training, not troubleshooting.</p>
          </div>
          <div className="mt-12 grid gap-9 border-t border-ar-line pt-8 md:grid-cols-3 md:gap-10">
            {benefits.map((benefit, i) => (
              <div key={benefit.title}>
                <span aria-hidden="true" className="ar-mono text-[11px] text-ar-faint">0{i + 1}</span>
                <h3 className="mt-4 text-[20px] font-medium tracking-tight">{benefit.title}</h3>
                <p className="mt-3 max-w-[340px] text-[15px] leading-[1.7] text-ar-muted">{benefit.body}</p>
              </div>
            ))}
          </div>
          <Link href="/Artemis/product/" className="group mt-10 inline-flex min-h-11 items-center gap-3 text-[14px] text-ar-fg">How Artemis works <Arrow /></Link>
        </Container>
      </section>
      <section id="contact" aria-labelledby="contact-title" className="border-t border-ar-line bg-ar-panel/40 py-16 md:py-20">
        <Container className="flex flex-col items-start justify-between gap-7 md:flex-row md:items-center">
          <div>
            <h2 id="contact-title" className="ar-display text-[clamp(1.8rem,3vw,2.5rem)] leading-tight">Training shouldn&apos;t be a waiting game.</h2>
            <p className="mt-4 text-[16px] text-ar-muted">Running distributed training? Let&apos;s talk about what slows you down.</p>
          </div>
          <a href={mailto("Artemis: let's talk")} className={`${button.solid} shrink-0`}>Talk to the founder <Arrow /></a>
        </Container>
      </section>
    </>
  );
}
