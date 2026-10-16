"use client";

import { useEffect, useState } from "react";

/** One click to the clipboard, for anyone pasting into an ATS or a scheduling tool. */
export default function CopyEmail({
  email,
  className,
  children,
  label = ["COPY EMAIL", "COPIED ✓"],
}: {
  email: string;
  className?: string;
  /** Shown before the label, e.g. the address itself. */
  children?: React.ReactNode;
  /** Idle and confirmed wording. */
  label?: [string, string];
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(id);
  }, [copied]);

  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(email);
          setCopied(true);
        } catch {
          window.location.href = `mailto:${email}`;
        }
      }}
    >
      {children}
      <span aria-live="polite">{copied ? label[1] : label[0]}</span>
    </button>
  );
}
