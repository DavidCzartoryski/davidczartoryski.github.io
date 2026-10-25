import Link from "next/link";
import { mailto } from "@/data/artemis";
import { Arrow, Container, button } from "./bits";

const stats = [
  { figure: "16 of 27", label: "large training jobs (512–1,024 GPUs) hit a fail-slow slowdown in one month" },
  { figure: "~10%", label: "of allocated GPU-hours lost to stragglers, estimated from one production cluster's traces" },
  { figure: "30+ min", label: "on average, and up to days, for engineers to manually find one faulty machine" },
];

const symptoms = [
  "Throughput drops a few percent mid-run — and stays down",
  "GPU utilization looks fine; the job is slow anyway",
  "No error names the GPU, link, or host that changed",
];

const loop = [
  {
    title: "Detect",
    body: "Artemis times every rank at the collectives it already joins, and compares each rank against its peers and its own history. A persistent slowdown is flagged while the job is still running — not in a postmortem.",
  },
  {
    title: "Confirm",
    body: "Before anyone acts, Artemis re-tests under matched conditions: same workload, hardware, and topology. A one-off fluctuation doesn't become an incident, and an unconfirmed regression never becomes the new baseline. The same matched testing runs after driver, library, or configuration changes.",
  },
  {
    title: "Localize",
    body: "Evidence across the host and input pipeline, the GPU, the communication runtime, and the interconnect narrows the problem to the rank, node, link, or software change responsible — with the measurements behind the conclusion, including when the evidence isn't enough to call it.",
  },
  {
    title: "Act",
    body: "Within the policies you set: rebalance work away from the slow rank, recommend a targeted fix, or apply a supported correction. Anything that needs a restart, a repair, or your approval is escalated — never hidden.",
  },
  {
    title: "Verify",
    body: "Artemis re-measures useful training throughput after the action. If it didn't recover, you see that too — and reversible actions roll back.",
  },
];

const catches = [
  { title: "GPU degradation", body: "Thermal throttling, power caps, clocks that stop boosting." },
  { title: "Communication", body: "A degraded port, link, or switch path; one island's collectives slowing down." },
  { title: "Host and input", body: "CPU contention, or a data-loader or storage stall holding one rank back off the GPU." },
  { title: "Change regressions", body: "Slowdowns that arrive with a driver, communication-library, or configuration change." },
];

const outcomes = [
  { title: "Recover GPU-hours you're already paying for", body: "measured against comparable workloads, not inferred from utilization." },
  { title: "Give engineers their time back", body: "investigations that take a team hours to days become one supervised workflow." },
  { title: "Keep the proof", body: "every fix verified against throughput; every conclusion traceable to measurements." },
];

const h2 = "ar-display text-[clamp(1.9rem,3.2vw,2.75rem)] leading-[1.12]";
const prose = "text-[17px] leading-[1.7] text-ar-muted";

export default function Homepage() {
  return (
    <>
      <section aria-label="Why it matters" className="border-t border-ar-line py-12 md:py-16">
        <Container>
          <dl className="grid gap-9 md:grid-cols-3 md:gap-10">
            {stats.map((stat) => (
              <div key={stat.figure} className="flex flex-col-reverse gap-3">
                <dt className="max-w-[320px] text-[15px] leading-[1.6] text-ar-muted">{stat.label}</dt>
                <dd className="ar-display text-[clamp(2rem,3.4vw,2.9rem)] leading-none text-ar-fg">{stat.figure}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-9 max-w-[760px] text-[12px] leading-relaxed text-ar-faint">
            Figures from published production-cluster studies:{" "}
            <a href="https://arxiv.org/abs/2410.12588" className="underline decoration-ar-line-2 underline-offset-2 hover:text-ar-fg">FALCON (arXiv:2410.12588)</a>,{" "}
            <a href="https://arxiv.org/abs/2505.05713" className="underline decoration-ar-line-2 underline-offset-2 hover:text-ar-fg">Lin et al. (arXiv:2505.05713)</a>,{" "}
            <a href="https://www.usenix.org/conference/nsdi25/presentation/deng" className="underline decoration-ar-line-2 underline-offset-2 hover:text-ar-fg">Minder, ByteDance (NSDI &apos;25)</a>.
          </p>
        </Container>
      </section>

      <section aria-labelledby="problem-title" className="border-t border-ar-line py-16 md:py-24">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
            <h2 id="problem-title" className={`${h2} max-w-[520px]`}>Nothing crashes. Every step just gets slower.</h2>
            <div className="max-w-[560px] space-y-5">
              <p className={prose}>Distributed training moves in lockstep: a step finishes when the slowest rank arrives. One degraded GPU, link, or host sets the pace for the entire job — while utilization still looks busy and nothing raises an error.</p>
              <p className={prose}>So teams find out late, or not at all. The run finishes hours behind, and the investigation starts from logs, across the infrastructure, network, storage, and hardware teams.</p>
              <ul className="space-y-3 border-t border-ar-line pt-6">
                {symptoms.map((s) => (
                  <li key={s} className="flex gap-3 text-[15px] leading-[1.6] text-ar-fg">
                    <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-ar-signal" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      <section id="how" aria-labelledby="how-title" className="scroll-mt-24 border-t border-ar-line py-16 md:py-24">
        <Container>
          <h2 id="how-title" className={h2}>From slowdown to verified recovery, in one loop.</h2>
          <ol className="mt-10 border-t border-ar-line">
            {loop.map((step, i) => (
              <li key={step.title} className="grid gap-3 border-b border-ar-line py-6 md:grid-cols-[40px_200px_1fr] md:gap-6">
                <span className="ar-mono text-[12px] text-ar-faint">{i + 1}</span>
                <h3 className="text-[18px] font-medium">{step.title}</h3>
                <p className="max-w-[680px] text-[16px] leading-[1.65] text-ar-muted">{step.body}</p>
              </li>
            ))}
          </ol>
          <Link href="/Artemis/product/" className="group mt-8 inline-flex min-h-11 items-center gap-3 text-[14px] text-ar-fg">Inside Artemis: the architecture and research <Arrow /></Link>
        </Container>
      </section>

      <section aria-labelledby="catches-title" className="border-t border-ar-line py-16 md:py-24">
        <Container>
          <h2 id="catches-title" className={h2}>The slowdowns that don&apos;t crash anything.</h2>
          <div className="mt-10 grid gap-px border border-ar-line bg-ar-line sm:grid-cols-2 lg:grid-cols-4">
            {catches.map((c) => (
              <div key={c.title} className="bg-ar-bg p-6">
                <h3 className="text-[17px] font-medium">{c.title}</h3>
                <p className="mt-3 text-[15px] leading-[1.65] text-ar-muted">{c.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section aria-labelledby="loop-title" className="border-t border-ar-line py-16 md:py-24">
        <Container>
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-16">
            <h2 id="loop-title" className={`${h2} max-w-[500px]`}>Not another dashboard to watch.</h2>
            <p className={`${prose} max-w-[560px] self-center`}>Monitoring tells you something is slow. Artemis closes the loop: it confirms the slowdown is real, localizes it, acts within your policies, and proves the recovery. The output isn&apos;t a chart — it&apos;s an incident with a cause, the evidence for it, the action taken, and the measured result.</p>
          </div>
          <div className="mt-12 grid gap-9 border-t border-ar-line pt-8 md:grid-cols-3 md:gap-10">
            {outcomes.map((o, i) => (
              <div key={o.title}>
                <span aria-hidden="true" className="ar-mono text-[11px] text-ar-faint">0{i + 1}</span>
                <h3 className="mt-4 text-[19px] font-medium tracking-tight">{o.title}</h3>
                <p className="mt-3 max-w-[340px] text-[15px] leading-[1.7] text-ar-muted">{o.body.charAt(0).toUpperCase() + o.body.slice(1)}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section aria-labelledby="who-title" className="border-t border-ar-line py-16 md:py-24">
        <Container>
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-16">
            <h2 id="who-title" className={`${h2} max-w-[520px]`}>Built for the team that owns training performance.</h2>
            <p className={`${prose} max-w-[560px] self-center`}>AI infrastructure, research-computing, and GPU-operations teams running distributed training on owned or rented clusters. Vendor-independent by design: across NVIDIA and AMD, across GPU generations, not tied to one cloud&apos;s or one vendor&apos;s stack.</p>
          </div>
        </Container>
      </section>

      <section id="contact" aria-labelledby="status-title" className="border-t border-ar-line bg-ar-panel/40 py-16 md:py-20">
        <Container>
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-16">
            <h2 id="status-title" className={`${h2} max-w-[520px]`}>In development — built with the teams who&apos;ll run it.</h2>
            <p className={`${prose} max-w-[560px] self-center`}>
              Artemis is in active development. What exists today: <Link href="/Artemis/product/#gpubridge" className="text-ar-fg underline decoration-ar-line-2 underline-offset-4 hover:decoration-ar-fg">GPUBridge</Link>, our open-source backend for mixed NVIDIA + AMD PyTorch jobs, and the detector prototypes described inside. We&apos;re talking with infrastructure teams about the slowdowns that cost them the most — those conversations set the roadmap.
            </p>
          </div>
          <div className="mt-12 flex flex-col items-start justify-between gap-7 border-t border-ar-line pt-10 md:flex-row md:items-center">
            <h2 className="ar-display text-[clamp(1.6rem,2.6vw,2.2rem)] leading-tight">Running distributed training? Tell us what slows you down.</h2>
            <a href={mailto("Artemis: let's talk")} className={`${button.solid} shrink-0`}>Talk to the founder <Arrow /></a>
          </div>
        </Container>
      </section>
    </>
  );
}
