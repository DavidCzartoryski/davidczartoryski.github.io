"use client";

import { useCallback, useState } from "react";
import { cargo, ventureDeep } from "@/data/site";
import Reveal from "./Reveal";
import VentureDetail from "./VentureDetail";

const TONE: Record<string, string> = {
  red: "bg-stamp-red",
  blue: "bg-stamp-blue",
  green: "bg-stamp-green",
  violet: "bg-stamp-violet",
};

export default function VentureCards() {
  const [openId, setOpenId] = useState<string | null>(null);
  const close = useCallback(() => setOpenId(null), []);

  const open = openId ? cargo.find((c) => c.id === openId) ?? null : null;
  const deep = openId ? ventureDeep[openId] ?? null : null;

  return (
    <>
      <ul className="grid gap-8 md:grid-cols-2">
        {cargo.map((c, i) => {
          const d = ventureDeep[c.id];
          return (
            <Reveal key={c.id} delay={(i % 2) * 0.08}>
              <li className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-ink transition-colors hover:border-gold/40">
                {/* strap */}
                <div className={`h-2 ${TONE[c.tone]}`} />

                <button
                  type="button"
                  onClick={() => d && setOpenId(c.id)}
                  disabled={!d}
                  aria-label={d ? `${c.name}: read the full breakdown` : c.name}
                  className="flex flex-1 cursor-pointer flex-col px-6 pb-6 pt-5 text-left disabled:cursor-default"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-[10px] tracking-[0.3em] text-fg-dim">TAG {c.tag}</span>
                    {d?.demo && (
                      <span className="rounded-full border border-gold/50 px-2.5 py-1 font-mono text-[9px] tracking-[0.2em] text-gold">
                        INTERACTIVE
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 font-display text-4xl leading-none tracking-tight md:text-5xl">
                    {c.name}
                  </h3>
                  <div className="mt-2 font-mono text-[10px] tracking-[0.25em] text-gold">
                    {c.sector.toUpperCase()}
                  </div>
                  <p className="mt-5 text-[15px] leading-relaxed text-paper/90">{c.blurb}</p>
                  <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-fg-muted">
                    {c.detail.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>

                  {d && (
                    <span className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] text-fg-dim transition-colors group-hover:text-gold">
                      READ THE BREAKDOWN
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </span>
                  )}
                </button>

                <div className="mt-auto flex items-end justify-between border-t border-dashed border-line px-6 py-4">
                  {c.metric ? (
                    <div>
                      <div className="font-display text-3xl leading-none tracking-tight text-gold-2">
                        {c.metric.value}
                      </div>
                      <div className="mt-1 font-mono text-[10px] tracking-[0.22em] text-fg-dim">
                        {c.metric.label.toUpperCase()}
                      </div>
                    </div>
                  ) : (
                    <span />
                  )}
                  {c.link && (
                    <a
                      href={c.link.href}
                      target="_blank"
                      rel="noopener"
                      className="font-mono text-[11px] tracking-[0.2em] text-paper underline-offset-4 hover:text-gold hover:underline"
                    >
                      {c.link.label} ↗
                    </a>
                  )}
                </div>
              </li>
            </Reveal>
          );
        })}
      </ul>

      <VentureDetail venture={open} deep={deep} onClose={close} />
    </>
  );
}
