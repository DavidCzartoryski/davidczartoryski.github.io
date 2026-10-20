/** Section scaffolding shared by every block on the page. */

export function Eyebrow({ children, n, className = "" }: { children: React.ReactNode; n?: string; className?: string }) {
  return (
    <p className={`ar-mono flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] ${className}`}>
      {n && <span className="opacity-60">{n}</span>}
      {n && <span aria-hidden="true" className="h-px w-6 bg-current opacity-40" />}
      <span>{children}</span>
    </p>
  );
}

/** Four corner ticks, like registration marks on a drawing. */
export function Ticks({ className = "border-ar-ink/40" }: { className?: string }) {
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

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[1240px] px-5 md:px-10 ${className}`}>{children}</div>;
}
