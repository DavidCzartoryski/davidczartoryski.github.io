"use client";

import { useEffect, useRef } from "react";

type Star = { x: number; y: number; r: number; a: number; speed: number; phase: number; depth: number; flare: boolean };
type Meteor = { x: number; y: number; vx: number; vy: number; t: number; life: number };

const FG = "237, 237, 234";
const AMBER = "242, 169, 59";

/**
 * The night sky behind the page: twinkling stars that drift a little with the
 * scroll, two faint orbits with a satellite each, and the odd amber meteor.
 * One fixed 2D canvas; it stops when the tab is hidden and draws a single
 * still frame for visitors who ask for reduced motion.
 */
export default function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");

    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    let meteor: Meteor | null = null;
    let nextMeteor = 3;
    let raf = 0;
    let prev = 0;

    const seed = () => {
      const n = Math.min(420, Math.round((w * h) / 5200));
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() ** 2.4 * 1.25 + 0.3,
        a: 0.2 + Math.random() * 0.55,
        speed: 0.5 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2,
        depth: 0.15 + Math.random() * 0.85,
        flare: false,
      }));
      // A handful of brighter four-point stars, like the glints in a long exposure.
      for (let i = 0; i < Math.min(7, Math.round(w / 220)); i++) {
        stars.push({ ...stars[i], r: 1.1, a: 0.85, flare: true, depth: 0.3 });
      }
    };

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const widthChanged = window.innerWidth !== w;
      w = window.innerWidth;
      // Mobile URL bars resize the viewport while scrolling; only a real width change reseeds.
      h = Math.max(window.innerHeight, widthChanged ? 0 : h);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (widthChanged) seed();
    };

    const draw = (t: number, dt: number) => {
      ctx.clearRect(0, 0, w, h);
      const sy = still.matches ? 0 : window.scrollY;
      const time = t / 1000;

      // Orbits, centred above the fold the way they frame the hero.
      const cx = w * 0.5;
      const cy = h * 0.38;
      const radii = [Math.min(w, h) * 0.32, Math.max(w, h) * 0.36];
      ctx.lineWidth = 1;
      radii.forEach((r, i) => {
        ctx.strokeStyle = `rgba(${FG}, ${i ? 0.03 : 0.045})`;
        ctx.beginPath();
        ctx.arc(cx, cy - sy * 0.04, r, 0, Math.PI * 2);
        ctx.stroke();
        const ang = (still.matches ? 0.8 + i * 2 : time * (i ? -0.018 : 0.03)) + i * 2.4;
        for (let k = 0; k < 14; k++) {
          const a = ang - (i ? -1 : 1) * k * 0.012;
          ctx.fillStyle = `rgba(${AMBER}, ${0.7 * (1 - k / 14) ** 2})`;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(a) * r, cy - sy * 0.04 + Math.sin(a) * r, k ? 1.1 : 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      for (const s of stars) {
        const y = (((s.y - sy * s.depth * 0.08) % h) + h) % h;
        const tw = still.matches ? 1 : 0.6 + 0.4 * Math.sin(time * s.speed + s.phase);
        const alpha = s.a * tw;
        if (s.flare) {
          const len = 6 + 4 * tw;
          const g = ctx.createRadialGradient(s.x, y, 0, s.x, y, len);
          g.addColorStop(0, `rgba(${FG}, ${alpha})`);
          g.addColorStop(1, `rgba(${FG}, 0)`);
          ctx.strokeStyle = g;
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(s.x - len, y);
          ctx.lineTo(s.x + len, y);
          ctx.moveTo(s.x, y - len);
          ctx.lineTo(s.x, y + len);
          ctx.stroke();
        }
        ctx.fillStyle = `rgba(${FG}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (still.matches) return;
      nextMeteor -= dt;
      if (!meteor && nextMeteor <= 0) {
        const ang = Math.PI * (0.62 + Math.random() * 0.12);
        const v = 520 + Math.random() * 260;
        meteor = { x: w * (0.35 + Math.random() * 0.6), y: h * Math.random() * 0.35, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, t: 0, life: 1.1 };
        nextMeteor = 6 + Math.random() * 7;
      }
      if (meteor) {
        meteor.t += dt;
        meteor.x += meteor.vx * dt;
        meteor.y += meteor.vy * dt;
        const fade = Math.sin(Math.PI * Math.min(1, meteor.t / meteor.life));
        const tail = 0.16;
        const g = ctx.createLinearGradient(meteor.x, meteor.y, meteor.x - meteor.vx * tail, meteor.y - meteor.vy * tail);
        g.addColorStop(0, `rgba(${AMBER}, ${0.9 * fade})`);
        g.addColorStop(1, `rgba(${AMBER}, 0)`);
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(meteor.x - meteor.vx * tail, meteor.y - meteor.vy * tail);
        ctx.stroke();
        if (meteor.t >= meteor.life) meteor = null;
      }
    };

    const frame = (t: number) => {
      const dt = prev ? Math.min(0.05, (t - prev) / 1000) : 0;
      prev = t;
      draw(t, dt);
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      prev = 0;
      if (still.matches) draw(0, 0);
      else if (!document.hidden) raf = requestAnimationFrame(frame);
    };
    const onResize = () => {
      resize();
      start();
    };

    resize();
    start();
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", start);
    still.addEventListener("change", start);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", start);
      still.removeEventListener("change", start);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="no-print pointer-events-none fixed inset-x-0 top-0 z-0 w-full" />;
}
