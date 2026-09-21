import Reveal from "./Reveal";

export default function SectionHeader({
  n,
  kicker,
  title,
  blurb,
}: {
  n: string;
  kicker: string;
  title: React.ReactNode;
  blurb?: React.ReactNode;
}) {
  return (
    <Reveal className="mb-14 md:mb-20">
      <div className="mb-6 flex items-center gap-4 font-mono text-[11px] tracking-[0.3em] text-fg-dim">
        <span className="text-gold">{n}</span>
        <span className="h-px w-10 bg-line-2" />
        <span className="uppercase">{kicker}</span>
      </div>
      <div className="grid gap-8 md:grid-cols-12 md:items-end">
        <h2 className="font-display text-[length:var(--step-h2)] leading-[0.98] tracking-[-0.02em] md:col-span-8">
          {title}
        </h2>
        {blurb && (
          <p className="max-w-md text-[15px] leading-relaxed text-fg-muted md:col-span-4 md:justify-self-end">
            {blurb}
          </p>
        )}
      </div>
    </Reveal>
  );
}
