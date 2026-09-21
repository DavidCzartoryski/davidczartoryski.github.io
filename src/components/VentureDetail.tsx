"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Cargo, VentureDeep } from "@/data/site";
import IndianRun from "./IndianRun";

export default function VentureDetail({
  venture,
  deep,
  onClose,
}: {
  venture: Cargo | null;
  deep: VentureDeep | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!venture) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [venture, onClose]);

  return (
    <AnimatePresence>
      {venture && deep && (
        <motion.div
          className="fixed inset-0 z-[90] overflow-y-auto bg-ink/92 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={venture.name}
        >
          <div className="min-h-full px-4 py-10 md:px-8 md:py-16">
            <motion.div
              className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-line bg-ink"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-ink/95 px-6 py-4 backdrop-blur md:px-10">
                <span className="font-mono text-[10px] tracking-[0.3em] text-fg-dim">TAG {venture.tag}</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="font-mono text-[11px] tracking-[0.3em] text-paper/80 transition-colors hover:text-gold"
                >
                  CLOSE ✕
                </button>
              </div>

              <div className="px-6 py-10 md:px-10 md:py-12">
                <div className="font-mono text-[10px] tracking-[0.25em] text-gold">
                  {venture.sector.toUpperCase()}
                </div>
                <h3 className="mt-4 font-display text-[length:var(--step-h2)] leading-[0.98] tracking-[-0.02em]">
                  {venture.name}
                </h3>
                <p className="mt-5 max-w-2xl text-[18px] leading-relaxed text-paper/90 md:text-[20px]">
                  {deep.tagline}
                </p>

                {deep.demo === "indian-run" && (
                  <div className="mt-10">
                    <IndianRun />
                  </div>
                )}

                <div className="mt-12 space-y-10">
                  {deep.sections.map((s) => (
                    <section key={s.heading}>
                      <h4 className="font-mono text-[10px] tracking-[0.3em] text-gold">
                        {s.heading.toUpperCase()}
                      </h4>
                      <div className="mt-4 space-y-4">
                        {s.body.map((para) => (
                          <p key={para} className="text-[16px] leading-relaxed text-fg-muted">
                            {para}
                          </p>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>

                {(deep.stack || venture.metric || venture.link) && (
                  <div className="mt-12 flex flex-wrap items-center justify-between gap-6 border-t border-dashed border-line pt-8">
                    <div className="flex flex-wrap gap-2">
                      {deep.stack?.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-line px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-fg-dim"
                        >
                          {t.toUpperCase()}
                        </span>
                      ))}
                    </div>
                    {venture.link && (
                      <a
                        href={venture.link.href}
                        target="_blank"
                        rel="noopener"
                        className="font-mono text-[11px] tracking-[0.2em] text-paper underline-offset-4 hover:text-gold hover:underline"
                      >
                        {venture.link.label} ↗
                      </a>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
