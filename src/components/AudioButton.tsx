"use client";

import { useAudio } from "./AudioProvider";

/** Cabin audio toggle. The VU bars only move while the song is playing. */
export default function AudioButton() {
  const { status, toggle } = useAudio();
  const on = status === "playing";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Pause theme song" : "Play theme song"}
      className={`inline-flex h-9 items-center gap-2.5 rounded-full border px-3.5 font-mono text-[11px] tracking-[0.22em] transition-colors ${
        on ? "border-gold/50 text-paper" : "border-line-2 text-fg-dim hover:text-paper"
      }`}
    >
      <span aria-hidden className="flex h-3 items-end gap-[2px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`block w-[2px] rounded-full ${on ? "bg-gold" : "bg-current opacity-60"}`}
            style={
              on
                ? { animation: `vu ${0.7 + i * 0.13}s ease-in-out infinite alternate`, height: "40%" }
                : { height: "3px" }
            }
          />
        ))}
      </span>
      {on ? "THEME" : "SOUND"}
    </button>
  );
}
