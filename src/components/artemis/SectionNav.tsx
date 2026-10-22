"use client";

import { useEffect, useRef, useState } from "react";
import { artemisNav } from "@/data/artemis";

/**
 * The section index. Marks the section crossing the middle of the viewport as
 * current; on small screens it is a scrolling row that keeps that link in view.
 */
export default function SectionNav({ variant }: { variant: "bar" | "row" }) {
  const [active, setActive] = useState<string | null>(null);
  const row = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const sections = artemisNav
      .map(({ id }) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    // Sections crossing the band in the middle of the viewport. Above the
    // first one (the hero) the set is empty and nothing is current.
    const crossing = new Set<string>();
    const order = artemisNav.map(({ id }) => id as string);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) crossing.add(entry.target.id);
          else crossing.delete(entry.target.id);
        }
        setActive([...order].reverse().find((id) => crossing.has(id)) ?? null);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (variant !== "row" || !active || !row.current) return;
    const link = row.current.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (!link) return;
    const list = row.current;
    const left = link.offsetLeft - (list.clientWidth - link.offsetWidth) / 2;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
  }, [active, variant]);

  if (variant === "bar") {
    return (
      <ul className="flex items-center gap-0.5">
        {artemisNav.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? "location" : undefined}
              className="rounded-full px-3 py-2 text-[13.5px] text-ar-muted transition-colors hover:text-ar-fg aria-[current]:text-ar-fg"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul ref={row} className="ar-scroll-x ar-fade-x flex gap-1 overflow-x-auto px-3 py-2">
      {artemisNav.map((item) => (
        <li key={item.id} className="shrink-0">
          <a
            href={`#${item.id}`}
            data-id={item.id}
            aria-current={active === item.id ? "location" : undefined}
            className="ar-label inline-flex h-8 items-center rounded-full border border-transparent px-3 text-[10px] text-ar-faint transition-colors aria-[current]:border-ar-line-2 aria-[current]:text-ar-fg"
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
