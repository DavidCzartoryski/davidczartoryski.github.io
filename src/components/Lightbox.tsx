"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Photo } from "@/lib/photos";

export type LightboxState = { photos: Photo[]; index: number; title: string } | null;

export default function Lightbox({
  state,
  onChange,
}: {
  state: LightboxState;
  onChange: (next: LightboxState) => void;
}) {
  const open = !!state;

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onChange(null);
      if (e.key === "ArrowRight") onChange({ ...state, index: (state.index + 1) % state.photos.length });
      if (e.key === "ArrowLeft")
        onChange({ ...state, index: (state.index - 1 + state.photos.length) % state.photos.length });
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [state, onChange]);

  return (
    <AnimatePresence>
      {open && state && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/92 p-4 backdrop-blur-sm md:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={() => onChange(null)}
          role="dialog"
          aria-modal="true"
          aria-label={state.title}
        >
          <div className="absolute left-6 top-5 font-mono text-[11px] tracking-[0.3em] text-fg-dim">
            {state.title.toUpperCase()} · {state.photos[state.index].place.toUpperCase()}
          </div>
          <div className="absolute right-6 top-5 font-mono text-[11px] tracking-[0.3em] text-fg-dim">
            {String(state.index + 1).padStart(2, "0")} / {String(state.photos.length).padStart(2, "0")}
          </div>
          <button
            type="button"
            className="absolute right-6 top-12 font-mono text-[11px] tracking-[0.3em] text-paper/80 hover:text-paper"
            onClick={() => onChange(null)}
          >
            CLOSE ✕
          </button>

          <motion.img
            key={state.photos[state.index].src}
            src={state.photos[state.index].src}
            alt={`${state.title}, ${state.photos[state.index].place}`}
            className="max-h-[82vh] max-w-full rounded-sm object-contain shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          />

          {state.photos.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-line-2 bg-ink/60 px-4 py-3 font-mono text-sm text-paper hover:border-gold md:left-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange({ ...state, index: (state.index - 1 + state.photos.length) % state.photos.length });
                }}
              >
                ←
              </button>
              <button
                type="button"
                aria-label="Next photo"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-line-2 bg-ink/60 px-4 py-3 font-mono text-sm text-paper hover:border-gold md:right-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange({ ...state, index: (state.index + 1) % state.photos.length });
                }}
              >
                →
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
