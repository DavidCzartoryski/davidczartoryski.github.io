import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/data/site";
import { artemisNav } from "@/data/artemis";
import Header, { Footer } from "@/components/artemis/Header";
import { Arrow, Container } from "@/components/artemis/bits";
import About from "@/components/artemis/About";
import Bridge from "@/components/artemis/Bridge";
import Detector from "@/components/artemis/Detector";
import Evidence from "@/components/artemis/Evidence";
import Feedback from "@/components/artemis/Feedback";
import HeroFigure from "@/components/artemis/HeroFigure";
import Problem from "@/components/artemis/Problem";
import Research from "@/components/artemis/Research";
import Story from "@/components/artemis/Story";
import Transport from "@/components/artemis/Transport";

const title = "Inside Artemis · Product, architecture, and research";
const description = "What Artemis is, how it works, and where it is headed: distributed training diagnostics, GPUBridge, performance evidence, and the autonomous performance-engineering workflow.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/Artemis/product/" },
  openGraph: { title, description, url: `${SITE_URL}/Artemis/product/`, siteName: "Artemis", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

const workflow = [
  ["Observe and detect", "Build workload-aware baselines and find persistent slowdowns without confusing different hardware with faulty hardware."],
  ["Confirm the regression", "Repeat suspicious measurements and compare matched workloads, hardware, topology, and software configurations."],
  ["Diagnose the cause", "Connect evidence across the input pipeline, host, GPU, collectives, and network. Test an explanation before treating it as a cause."],
  ["Take permitted action", "Recommend a targeted fix or apply a supported correction within operator policy. Keep workload adaptation mathematically correct."],
  ["Verify recovery", "Measure whether useful throughput improved. Keep the evidence, support reversible rollback, and escalate what needs an engineer."],
];

export default function ProductPage() {
  return (
    <>
      <Header product />
      <main id="main" tabIndex={-1} className="outline-none">
        <section aria-labelledby="product-title" className="py-14 md:py-24">
          <Container>
            <Link href="/Artemis/" className="inline-flex min-h-10 items-center gap-2 text-[13px] text-ar-faint hover:text-ar-fg"><span aria-hidden="true">←</span> Artemis home</Link>
            <p className="ar-label mt-8 text-ar-faint">What we are. What we&apos;re building.</p>
            <h1 id="product-title" className="ar-display mt-5 max-w-[900px] text-[clamp(2.4rem,5vw,4.25rem)] leading-[1.06]">Performance engineering,<br /><span className="text-ar-signal-ink">from signal to recovery.</span></h1>
            <p className="mt-7 max-w-[760px] text-[18px] leading-[1.7] text-ar-muted">Artemis is an autonomous performance engineer for distributed AI training. We&apos;re building a system that connects continuous detection, evidence-backed diagnosis, performance-regression testing, and permitted correction in one closed loop.</p>
            <p className="mt-4 max-w-[760px] text-[16px] leading-[1.7] text-ar-muted">The goal: more useful training from the GPUs you already have, with less manual investigation. Built for teams running owned or rented clusters, across supported GPU vendors and generations.</p>
            <div className="mt-9 border-l-2 border-ar-signal pl-5">
              <h2 className="text-[16px] font-medium">An early product, with a clear destination.</h2>
              <p className="mt-2 max-w-[800px] text-[14px] leading-[1.7] text-ar-muted">The full autonomous workflow below is our product direction, not a claim that every capability is production-ready. Existing work includes GPUBridge and detector prototypes. Hardware results later on this page are historical, scoped experiments—not customer deployments or guarantees for the current build.</p>
            </div>
            <nav aria-label="Product contents" className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-y border-ar-line py-4 text-[13px] text-ar-muted">
              <a href="#workflow" className="py-1 hover:text-ar-fg">Product vision</a>
              {artemisNav.map((item) => <a key={item.id} href={`#${item.id}`} className="py-1 hover:text-ar-fg">{item.label}</a>)}
              <a href="#about" className="py-1 hover:text-ar-fg">Founder</a>
            </nav>
          </Container>
        </section>
        <section id="workflow" aria-labelledby="workflow-title" className="border-t border-ar-line py-16 md:py-24">
          <Container>
            <p className="ar-label text-ar-faint">The product vision</p>
            <h2 id="workflow-title" className="ar-display mt-5 text-[clamp(1.9rem,3.5vw,3rem)] leading-tight">An engineer in the loop.<br />Not an engineer on every alert.</h2>
            <ol className="mt-10 border-t border-ar-line">
              {workflow.map(([heading, body], i) => (
                <li key={heading} className="grid gap-3 border-b border-ar-line py-6 md:grid-cols-[40px_240px_1fr] md:gap-6">
                  <span className="ar-mono text-[12px] text-ar-faint">0{i + 1}</span>
                  <h3 className="text-[18px] font-medium">{heading}</h3>
                  <p className="max-w-[640px] text-[16px] leading-[1.65] text-ar-muted">{body}</p>
                </li>
              ))}
            </ol>
            <p className="mt-7 max-w-[800px] text-[15px] leading-[1.7] text-ar-muted">Cross-stack diagnosis and scheduled regression testing are planned work. A learned diagnosis model needs permitted incident data and held-out evaluation. The dedicated agent telemetry/control plane is separate from GPUBridge&apos;s training-data transport; RDMA support in one does not establish completion of the other.</p>
            <div className="mt-12"><HeroFigure /></div>
            <a href="#detector" className="mt-6 inline-flex min-h-11 items-center gap-2 text-[14px] text-ar-muted hover:text-ar-fg">Explore the detector architecture <Arrow /></a>
          </Container>
        </section>
        <Problem />
        <Story />
        <Bridge />
        <Transport />
        <Detector />
        <Evidence />
        <Research />
        <About />
        <Feedback />
      </main>
      <Footer />
    </>
  );
}
