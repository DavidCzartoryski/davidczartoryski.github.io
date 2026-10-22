/** Section scaffolding shared by every block on the page. */

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[1240px] px-5 md:px-10 ${className}`}>{children}</div>;
}

export function Eyebrow({ children, n, className = "" }: { children: React.ReactNode; n?: string; className?: string }) {
  return (
    <p className={`ar-label flex items-center gap-3 text-ar-faint ${className}`}>
      {n && <span className="text-ar-fg">{n}</span>}
      {n && <span aria-hidden="true" className="h-px w-6 bg-ar-line-2" />}
      <span>{children}</span>
    </p>
  );
}

/** Eyebrow, heading and an optional lede, the opening of every section. */
export function SectionHead({
  id,
  n,
  eyebrow,
  title,
  lede,
  aside,
}: {
  id: string;
  n: string;
  eyebrow: React.ReactNode;
  title: string;
  lede?: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-7">
        <Eyebrow n={n}>{eyebrow}</Eyebrow>
        <h2 id={id} className="ar-display mt-6 text-[clamp(2rem,3.9vw,3.3rem)] leading-[1.04] text-ar-fg">
          {title}
        </h2>
      </div>
      {(lede || aside) && (
        <div className="self-end lg:col-span-5">
          {lede && <p className="text-[17px] leading-[1.65] text-ar-muted">{lede}</p>}
          {aside}
        </div>
      )}
    </div>
  );
}

/** Four corner ticks, like registration marks on a drawing. */
export function Ticks({ className = "border-ar-fg/35" }: { className?: string }) {
  const base = `pointer-events-none absolute h-2.5 w-2.5 ${className}`;
  return (
    <>
      <span aria-hidden="true" className={`${base} -left-px -top-px border-l border-t`} />
      <span aria-hidden="true" className={`${base} -right-px -top-px border-r border-t`} />
      <span aria-hidden="true" className={`${base} -bottom-px -left-px border-b border-l`} />
      <span aria-hidden="true" className={`${base} -bottom-px -right-px border-b border-r`} />
    </>
  );
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path d="M3 8h9.5M8.5 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/** A small pill. `tone` picks the dot: the regression, a channel, or none. */
export function Tag({
  children,
  tone,
  className = "",
}: {
  children: React.ReactNode;
  tone?: "signal" | "data" | "ctl" | "dashed";
  className?: string;
}) {
  const dot = { signal: "bg-ar-signal", data: "bg-ar-data", ctl: "bg-ar-ctl", dashed: "" }[tone ?? "dashed"];
  return (
    <span
      className={`ar-label inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-2.5 py-1 text-[9.5px] text-ar-muted ${
        tone === "dashed" ? "border-dashed border-ar-line-2" : "border-ar-line-2"
      } ${className}`}
    >
      {tone && tone !== "dashed" && <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
      {children}
    </span>
  );
}

/** The two button styles the page uses, as class strings for <a> and <button>. */
export const button = {
  solid:
    "group inline-flex h-12 items-center gap-2.5 rounded-full bg-ar-fg px-6 text-[15px] font-medium text-ar-bg transition-opacity hover:opacity-85",
  line: "inline-flex h-12 items-center gap-2.5 rounded-full border border-ar-line-2 px-6 text-[15px] font-medium text-ar-fg transition-colors hover:border-ar-fg/60",
};
