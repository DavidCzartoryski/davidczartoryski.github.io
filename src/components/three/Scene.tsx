"use client";

import { useEffect, useRef } from "react";
import { animate, useMotionValueEvent, useScroll } from "motion/react";
import { createRoot, extend, type ReconcilerRoot } from "@react-three/fiber";
import {
  Color,
  DirectionalLight,
  FogExp2,
  Group,
  HemisphereLight,
  InstancedMesh,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Points,
} from "three";
import { useAudio } from "../AudioProvider";
import { useIntro } from "../IntroContext";
import { STOPS } from "./route";
import { flight } from "./store";
import World from "./World";

// Only what the scenes use. <Canvas> would register all of three and defeat
// tree-shaking; a bare root with a short catalogue keeps the chunk small.
extend({ Color, DirectionalLight, FogExp2, Group, HemisphereLight, InstancedMesh, LineSegments, Mesh, MeshBasicMaterial, MeshLambertMaterial, Points });

const INTERACTIVE = "a,button,input,textarea,select,label,summary,[role=button],[role=dialog],[contenteditable]";
/** Anything with words in it: dragging there should select text, not spin the globe. */
const TEXTY = "p,h1,h2,h3,h4,li,dd,dt,span,em,strong,figure,img,svg";
const HOLD_MOVE_PX = 14;

let audioCtx: AudioContext | null = null;
/** A soft filtered-noise whoosh, only when the SOUND toggle is on. */
function whoosh() {
  if (!flight.soundOn) return;
  try {
    audioCtx ??= new AudioContext();
  } catch {
    return;
  }
  const ctx = audioCtx;
  void ctx.resume();
  const dur = 1.3;
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 0.9;
  const gain = ctx.createGain();
  const t0 = ctx.currentTime;
  band.frequency.setValueAtTime(260, t0);
  band.frequency.exponentialRampToValueAtTime(1800, t0 + 0.55);
  band.frequency.exponentialRampToValueAtTime(420, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.2, t0 + 0.35);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(band).connect(gain).connect(ctx.destination);
  src.start(t0);
  src.stop(t0 + dur);
}

const scrollToInstant = (top: number) => window.scrollTo({ top, behavior: "instant" });

export default function Scene() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const arcRef = useRef<SVGCircleElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<ReconcilerRoot<HTMLCanvasElement> | null>(null);
  const { done } = useIntro();
  const { status } = useAudio();
  const doneRef = useRef(done);

  // Scroll drives everything; the motion value only ever writes to the store.
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    flight.scrollY = y;
    flight.invalidate();
  });

  useEffect(() => {
    flight.soundOn = status === "playing";
  }, [status]);

  // Pause the loop while the tab is hidden or the boarding intro covers the page.
  const applyLoop = () => {
    const root = rootRef.current;
    if (!root) return;
    const paused = document.hidden || !doneRef.current;
    void root.configure({ frameloop: paused ? "never" : flight.reduced ? "demand" : "always" });
    if (!paused) flight.invalidate();
  };

  useEffect(() => {
    const wasDone = doneRef.current;
    doneRef.current = done;
    if (done && !wasDone) flight.introAt = performance.now();
    applyLoop();
  }, [done]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const html = document.documentElement;
    const cleanups: (() => void)[] = [];
    const on = <K extends keyof WindowEventMap>(k: K, fn: (e: WindowEventMap[K]) => void, opts?: AddEventListenerOptions) => {
      window.addEventListener(k, fn, opts);
      cleanups.push(() => window.removeEventListener(k, fn, opts));
    };

    flight.dom = { ring: ringRef.current, arc: arcRef.current, hint: hintRef.current };
    if (process.env.NODE_ENV !== "production") (window as unknown as { __flight: typeof flight }).__flight = flight;
    flight.scrollY = window.scrollY;
    flight.introAt = performance.now();

    // ---- section offsets
    const measure = () => {
      flight.vw = window.innerWidth;
      flight.vh = window.innerHeight;
      flight.stations = STOPS.map((id) => {
        const el = document.getElementById(id);
        if (!el) return { id, top: 0, height: 0 };
        const r = el.getBoundingClientRect();
        return { id, top: r.top + window.scrollY, height: r.height };
      });
      flight.invalidate();
    };
    let raf = 0;
    const remeasure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    measure();
    const ro = new ResizeObserver(remeasure);
    ro.observe(document.body);
    cleanups.push(() => ro.disconnect());

    // ---- renderer
    const size = () => ({ width: window.innerWidth, height: window.innerHeight, top: 0, left: 0 });
    const root = createRoot(canvas);
    let alive = true;
    void root
      .configure({
        size: size(),
        dpr: [1, flight.touch ? 1 : 1.5],
        flat: true,
        frameloop: "never",
        gl: { antialias: !flight.touch, alpha: false, stencil: false, powerPreference: "high-performance" },
        camera: { fov: 50, near: 0.1, far: 220, position: [0, 0, 12] },
      })
      .then(() => {
        if (!alive) return;
        root.render(<World />);
        rootRef.current = root;
        applyLoop();
      });
    on("resize", () => {
      void root.configure({ size: size() });
      remeasure();
    });
    const onVis = () => applyLoop();
    document.addEventListener("visibilitychange", onVis);
    cleanups.push(() => document.removeEventListener("visibilitychange", onVis));

    flight.onReady = () => {
      flight.active = true;
      html.classList.add("nf-on");
      if (wrapRef.current) wrapRef.current.style.opacity = "1";
    };

    // ---- pointer (mouse and pen only: touch gets idle drift instead)
    on("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      flight.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      flight.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      flight.pointer.inside = true;
    }, { passive: true });
    const leave = () => (flight.pointer.inside = false);
    document.addEventListener("mouseleave", leave);
    cleanups.push(() => document.removeEventListener("mouseleave", leave));

    // ---- hold to board
    let holdId = -1;
    let holdTimer = 0;
    let dive: { stop: () => void } | null = null;
    const endHold = () => {
      flight.hold.start = 0;
      holdId = -1;
      window.clearTimeout(holdTimer);
      html.classList.remove("nf-holding");
    };
    on("pointerdown", (e) => {
      if (flight.reduced || !e.isPrimary || e.button !== 0 || flight.routeS > 0.55) return;
      const t = e.target as Element | null;
      if (!t?.closest?.("#top") || t.closest(INTERACTIVE)) return;
      flight.hold.start = performance.now();
      flight.hold.x = e.clientX;
      flight.hold.y = e.clientY;
      holdId = e.pointerId;
      // Only once the press has stayed still is it a hold: a quick drag still selects text.
      window.clearTimeout(holdTimer);
      holdTimer = window.setTimeout(() => {
        if (!flight.hold.start) return;
        html.classList.add("nf-holding");
        window.getSelection()?.removeAllRanges();
      }, 140);
    });
    on("pointermove", (e) => {
      if (!flight.hold.start || e.pointerId !== holdId) return;
      if (Math.hypot(e.clientX - flight.hold.x, e.clientY - flight.hold.y) > HOLD_MOVE_PX) endHold();
    }, { passive: true });
    on("pointerup", endHold);
    on("pointercancel", endHold);
    on("blur", endHold);
    on("wheel", endHold, { passive: true });
    on("contextmenu", (e) => {
      if (flight.hold.start) e.preventDefault();
    });

    const stopDive = () => {
      dive?.stop();
      dive = null;
    };
    on("wheel", stopDive, { passive: true });
    on("touchstart", stopDive, { passive: true });
    on("keydown", stopDive);

    flight.board = () => {
      endHold();
      flight.boardedAt = performance.now();
      whoosh();
      const passport = flight.stations[1];
      if (!passport) return;
      stopDive();
      dive = animate(window.scrollY, Math.max(0, passport.top - 72), {
        duration: 1.5,
        ease: [0.55, 0, 0.25, 1],
        onUpdate: scrollToInstant,
      });
    };

    flight.flyHome = () =>
      new Promise<void>((resolve) => {
        stopDive();
        const from = window.scrollY;
        if (from < 4) return resolve();
        dive = animate(from, 0, {
          duration: Math.min(2.6, 1.2 + from / 9000),
          ease: [0.65, 0, 0.35, 1],
          onUpdate: scrollToInstant,
          onComplete: () => resolve(),
        });
      });

    // ---- hovers that steer the scene (stamps turn the globe, cards lift their crate)
    const track = (e: Event) => {
      const t = e.target as Element | null;
      flight.hoverStamp = t?.closest?.("[data-stamp]")?.getAttribute("data-stamp") ?? null;
      flight.hoverVenture = t?.closest?.("[data-venture]")?.getAttribute("data-venture") ?? null;
      flight.invalidate();
    };
    document.addEventListener("pointerover", track);
    document.addEventListener("focusin", track);
    cleanups.push(() => {
      document.removeEventListener("pointerover", track);
      document.removeEventListener("focusin", track);
    });

    // ---- flight-log legs ignite as their cards come into view
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue;
          const i = Number((en.target as HTMLElement).dataset.leg);
          if (i >= 0 && i < flight.legs.length) flight.legs[i] = true;
          flight.invalidate();
        }
      },
      { threshold: 0.35 },
    );
    document.querySelectorAll("[data-leg]").forEach((el) => io.observe(el));
    cleanups.push(() => io.disconnect());

    // ---- drag the globe from the empty space around the passport section
    let dragId = -1;
    let lastX = 0;
    let lastY = 0;
    const endDrag = () => {
      dragId = -1;
      flight.globeDrag.active = false;
      html.classList.remove("nf-dragging");
    };
    on("pointerdown", (e) => {
      if (!e.isPrimary || e.button !== 0) return;
      const t = e.target as Element | null;
      if (!t?.closest?.("#passport") || t.closest(INTERACTIVE) || t.closest(TEXTY)) return;
      dragId = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      flight.globeDrag.active = true;
      html.classList.add("nf-dragging");
    });
    on("pointermove", (e) => {
      if (e.pointerId !== dragId) return;
      flight.globeDrag.dx += e.clientX - lastX;
      flight.globeDrag.dy += e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      flight.invalidate();
    }, { passive: true });
    on("pointerup", endDrag);
    on("pointercancel", endDrag);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      cleanups.forEach((f) => f());
      stopDive();
      endHold();
      endDrag();
      root.unmount();
      rootRef.current = null;
      flight.active = false;
      flight.flyHome = null;
      html.classList.remove("nf-on");
    };
  }, []);

  return (
    <>
      <div
        ref={wrapRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-0 transition-opacity duration-[1600ms] ease-out"
      >
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>

      {/* Hold-to-board overlay: positioned and filled by the render loop, never interactive. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
        <div ref={ringRef} className="absolute left-0 top-0 opacity-0" style={{ willChange: "transform, opacity" }}>
          <svg width="76" height="76" viewBox="0 0 76 76" className="-translate-x-1/2 -translate-y-1/2">
            <circle cx="38" cy="38" r="30" fill="none" stroke="rgba(243,234,216,0.22)" strokeWidth="1.5" />
            <circle
              ref={arcRef}
              cx="38"
              cy="38"
              r="30"
              fill="none"
              stroke="var(--stamp-red)"
              strokeWidth="2.5"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset="1"
              transform="rotate(-90 38 38)"
            />
          </svg>
        </div>
        <div
          ref={hintRef}
          className="absolute left-0 top-0 whitespace-nowrap font-mono text-[10px] tracking-[0.3em] text-paper/70 opacity-0"
          style={{ willChange: "transform, opacity" }}
        >
          <span className="-translate-x-1/2 inline-block">{flight.touch ? "HOLD TO BOARD" : "PRESS & HOLD TO BOARD"}</span>
        </div>
      </div>
    </>
  );
}
