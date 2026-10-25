import Mark from "./Mark";

/** A conceptual workflow, not a screenshot, live monitor, or measured result. */
export default function PerformanceLoop() {
  const steps = [
    { title: "Detect", text: "Find the slowdown", color: "bg-ar-signal" },
    { title: "Diagnose", text: "Trace the cause", color: "bg-ar-fg/70" },
    { title: "Resolve", text: "Act within your policies", color: "bg-ar-fg/70" },
    { title: "Verify", text: "Confirm training recovers", color: "bg-ar-ctl" },
  ];
  return (
    <figure className="relative rounded-2xl border border-ar-line-2 bg-ar-panel/70 p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4 border-b border-ar-line pb-5">
        <div className="flex items-center gap-2.5"><Mark size={23} /><span className="ar-label text-ar-muted">The performance loop</span></div>
        <span aria-hidden="true" className="text-ar-faint">↻</span>
      </div>
      <ol className="py-4">
        {steps.map((step, i) => (
          <li key={step.title} className="relative grid grid-cols-[28px_1fr] items-center gap-4 py-5">
            {i < steps.length - 1 && <span aria-hidden="true" className="absolute bottom-[-24px] left-[13px] top-[46px] w-px bg-ar-line-2" />}
            <span aria-hidden="true" className="relative flex h-7 w-7 items-center justify-center rounded-full border border-ar-line-2 bg-ar-panel"><span className={`h-1.5 w-1.5 rounded-full ${step.color}`} /></span>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="text-[18px] font-medium text-ar-fg">{step.title}</span>
              <span className="text-[13px] text-ar-faint">{step.text}</span>
            </div>
          </li>
        ))}
      </ol>
      <figcaption className="border-t border-ar-line pt-4 text-[12px] leading-relaxed text-ar-faint">The workflow we&apos;re building. Engineers set the boundaries.</figcaption>
    </figure>
  );
}
