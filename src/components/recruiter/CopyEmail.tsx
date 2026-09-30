"use client";

import { useEffect, useState } from "react";

/** One click to the clipboard, for anyone pasting into an ATS or a scheduling tool. */
export default function CopyEmail({ email, className }: { email: string; className?: string }) {
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
      <span aria-live="polite">{copied ? "COPIED ✓" : "COPY EMAIL"}</span>
    </button>
  );
}
