"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/**
 * Departure-board style text: each character flips through the alphabet
 * before settling, later characters settling later.
 */
export default function SplitFlap({ value, className }: { value: string; className?: string }) {
  const [shown, setShown] = useState(value);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let step = 0;
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      step += 1;
      let settled = true;
      const next = value
        .split("")
        .map((ch, i) => {
          if (ch === " ") return " ";
          const settleAt = 6 + i * 3;
          if (step >= settleAt) return ch;
          settled = false;
          return GLYPHS[(step * 7 + i * 11) % GLYPHS.length];
        })
        .join("");
      setShown(next);
      if (settled && timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    }, 48);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [value]);

  return (
    <span className={`inline-flex gap-[0.08em] font-mono ${className ?? ""}`} aria-label={value}>
      {shown.split("").map((ch, i) => (
        <span key={i} className="flap" aria-hidden>
          {ch}
        </span>
      ))}
    </span>
  );
}
