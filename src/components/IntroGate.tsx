"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import AlarmClock from "./AlarmClock";
import Plane from "./Plane";
import { useAudio } from "./AudioProvider";
import { useIntro } from "./IntroContext";
import {
  BUZZER_AT,
  CRUISE_VOLUME,
  REVEAL_AT,
  SONG_START,
  TAKEOFF_AT,
} from "@/lib/audio-cues";

type Phase = "gate" | "buildup" | "ringing" | "takeoff" | "done";

const SEEN_KEY = "dc-intro";

/** sessionStorage throws under some privacy settings; a blank page is never the right answer. */
const store = {
  get: () => {
    try {
      return sessionStorage.getItem(SEEN_KEY);
    } catch {
      return null;
    }
  },
  set: () => {
    try {
      sessionStorage.setItem(SEEN_KEY, "seen");
    } catch {
      /* ignore */
    }
  },
};
const CODES = ["BOS", "WAW", "MXP", "SFO", "IST", "DXB", "TIA", "ATH", "VIE", "BUD", "PRG", "AMS", "CDG", "TBS", "SJD", "MBJ", "YYZ"];

export default function IntroGate() {
  const { setDone, replayKey } = useIntro();
  return <Gate key={replayKey} onDone={() => setDone(true)} />;
}

function Gate({ onDone }: { onDone: () => void }) {
  const audio = useAudio();
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase | null>(null);
  const [t, setT] = useState(SONG_START);
  const [jitter, setJitter] = useState({ x: 0, y: 0 });
  const [running, setRunning] = useState(false);
  const clockRef = useRef<{ started: number; useTimer: boolean } | null>(null);
  const finishedRef = useRef(false);

  // Decide on mount: skip if this tab has already boarded. sessionStorage is
  // client-only, so this one-time read has to happen after hydration.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("intro") === "off") store.set();
    if (store.get() === "seen") {
      finishedRef.current = true;
      setPhase("done");
      onDone();
    } else {
      setPhase("gate");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setRunning(false);
    store.set();
    setPhase("done");
    audio.fadeTo(CRUISE_VOLUME, 2500);
    onDone();
  }, [audio, onDone]);

  // The choreography is driven by the song's own clock, read every frame.
  useEffect(() => {
    if (!running) return;
    let id = 0;
    const loop = () => {
      const c = clockRef.current;
      const el = audio.elRef.current;
      if (!c) return;
      const now = c.useTimer || !el ? SONG_START + (performance.now() - c.started) / 1000 : el.currentTime;
      setT(now);
      const p = Math.min(1, Math.max(0, (now - SONG_START) / (BUZZER_AT - SONG_START)));
      const amp = Math.pow(p, 3) * 3.5;
      setJitter({ x: (Math.random() - 0.5) * amp, y: (Math.random() - 0.5) * amp });
      if (now >= REVEAL_AT) {
        finish();
        return;
      }
      setPhase(now >= TAKEOFF_AT ? "takeoff" : now >= BUZZER_AT ? "ringing" : "buildup");
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [running, audio.elRef, finish]);

  const board = useCallback(async () => {
    const ok = await audio.start();
    clockRef.current = { started: performance.now(), useTimer: !ok };
    if (reduced) {
      // No 12-second choreography for reduced-motion visitors: sound on, straight in.
      finish();
      return;
    }
    setPhase("buildup");
    setRunning(true);
  }, [audio, finish, reduced]);


  if (phase === null) {
    // Pre-hydration: keep the page covered so the hero never flashes first.
    return <div className="fixed inset-0 z-[100] bg-ink" aria-hidden />;
  }

  const progress = Math.min(1, Math.max(0, (t - SONG_START) / (BUZZER_AT - SONG_START)));
  const remaining = Math.max(0, BUZZER_AT - t);
  const ringing = phase === "ringing" || phase === "takeoff";

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          key="overlay"
          className="fixed inset-0 z-[100] overflow-hidden bg-ink text-paper"
          initial={{ clipPath: "circle(150% at 50% 50%)" }}
          exit={{
            clipPath: "circle(0% at 88% 10%)",
            transition: { duration: 1.1, ease: [0.65, 0, 0.35, 1] },
          }}
          role="dialog"
          aria-label="Boarding"
        >
          {/* sky */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 110%, #1a2550 0%, #0b1020 55%, #05080f 100%)",
            }}
          />
          <Stars />

          {phase === "gate" && <BoardingGate onBoard={board} onSkip={finish} />}

          {phase !== "gate" && (
            <div className="relative flex h-full flex-col items-center justify-center">
              {/* readouts */}
              <div className="absolute left-6 top-6 font-mono text-[11px] tracking-[0.28em] text-fg-dim md:left-10 md:top-8">
                WAKE-UP CALL · 06:00 · BOS
              </div>
              <div className="absolute right-6 top-6 font-mono text-[11px] tracking-[0.28em] text-fg-dim md:right-10 md:top-8">
                {ringing ? "BOARDING" : `T-MINUS ${remaining.toFixed(1)}S`}
              </div>

              {/* buzzer flash */}
              {ringing && (
                <motion.div
                  aria-hidden
                  className="absolute inset-0 bg-gold"
                  initial={{ opacity: 0.55 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                />
              )}

              {/* the clock, then the plane */}
              <div className="relative h-[min(72vw,440px)] w-[min(72vw,440px)]">
                {/* build-up arc */}
                <svg
                  viewBox="0 0 100 100"
                  className="absolute inset-[-8%] h-[116%] w-[116%] transition-opacity duration-700"
                  style={{ opacity: phase === "takeoff" ? 0 : 1 }}
                  aria-hidden
                >
                  <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(243,234,216,0.08)" strokeWidth="0.6" />
                  <circle
                    cx="50"
                    cy="50"
                    r="47"
                    fill="none"
                    stroke="var(--gold)"
                    strokeWidth="0.9"
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray="1"
                    strokeDashoffset={1 - progress}
                    transform="rotate(-90 50 50)"
                  />
                </svg>

                <AnimatePresence>
                  {phase !== "takeoff" && (
                    <motion.div
                      key="clock"
                      className="absolute inset-0"
                      style={{ x: jitter.x, y: jitter.y, scale: 0.94 + progress * 0.1 }}
                      exit={{ scaleX: 2.2, scaleY: 0.25, opacity: 0, transition: { duration: 0.42, ease: [0.65, 0, 0.35, 1] } }}
                    >
                      <AlarmClock seconds={t - SONG_START} ringing={ringing} tension={progress} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {phase === "takeoff" && (
                  <>
                    {/* contrail */}
                    <motion.div
                      aria-hidden
                      className="absolute left-1/2 top-1/2 h-[3px] w-[160vmax] origin-left"
                      style={{
                        rotate: -35,
                        background:
                          "linear-gradient(90deg, rgba(243,234,216,0) 0%, rgba(243,234,216,0.55) 12%, rgba(243,234,216,0.15) 45%, rgba(243,234,216,0) 100%)",
                      }}
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ delay: 0.45, duration: 1.1, ease: "easeIn" }}
                    />
                    <motion.div
                      key="plane"
                      className="absolute inset-0 flex items-center justify-center text-paper"
                      initial={{ scale: 0.25, opacity: 0, rotate: 0, x: 0, y: 0 }}
                      animate={{
                        scale: [0.25, 1, 1, 0.55],
                        opacity: [0, 1, 1, 1],
                        rotate: [0, -6, -35, -35],
                        x: [0, 0, "34vw", "70vw"],
                        y: [0, 0, "-24vh", "-70vh"],
                      }}
                      transition={{ duration: 1.5, times: [0, 0.28, 0.7, 1], ease: ["easeOut", "easeIn", "linear"] }}
                    >
                      <Plane size="62%" />
                    </motion.div>
                  </>
                )}
              </div>

              <div className="mt-10 text-center">
                <div className="font-display text-[clamp(1.4rem,3vw,2.2rem)] italic text-paper/90">
                  {ringing ? "Time to go." : "Somewhere, an alarm is about to go off."}
                </div>
                <div className="mt-2 font-mono text-[11px] tracking-[0.3em] text-fg-dim">
                  {ringing ? "GATE 23 · NOW BOARDING" : "THE SONG BUILDS · THE BUZZER HITS · WE LEAVE"}
                </div>
              </div>

              <CodeStrip speed={1 + progress * 3} />

              <button
                type="button"
                onClick={finish}
                className="absolute bottom-6 right-6 font-mono text-[11px] tracking-[0.25em] text-fg-dim underline-offset-4 hover:text-paper hover:underline md:bottom-8 md:right-10"
              >
                SKIP →
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BoardingGate({ onBoard, onSkip }: { onBoard: () => void; onSkip: () => void }) {
  return (
    <motion.div
      className="relative flex h-full flex-col items-center justify-center px-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-8 font-mono text-[11px] tracking-[0.32em] text-fg-dim">
        HERCULES AIR · FLIGHT HH 2027 · GATE 23
      </div>

      {/* boarding pass */}
      <div className="paper relative w-full max-w-[680px] overflow-hidden rounded-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-between border-b border-ink/15 px-6 py-3 font-mono text-[11px] tracking-[0.3em] text-ink/70">
          <span>BOARDING PASS</span>
          <span className="flex items-center gap-2">
            <Plane size={14} /> HERCULES AIR
          </span>
        </div>
        <div className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_180px]">
          <div className="px-6 py-6 md:px-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="font-mono text-[10px] tracking-[0.25em] text-ink/55">FROM</div>
                <div className="font-display text-[clamp(2.6rem,7vw,4.6rem)] leading-none tracking-tight text-ink">BOS</div>
                <div className="font-mono text-[11px] tracking-[0.15em] text-ink/60">BOSTON</div>
              </div>
              <div className="mb-5 flex flex-1 items-center gap-2 px-2 text-ink/50">
                <span className="h-px flex-1 border-t border-dashed border-ink/40" />
                <Plane size={18} />
                <span className="h-px flex-1 border-t border-dashed border-ink/40" />
              </div>
              <div className="text-right">
                <div className="font-mono text-[10px] tracking-[0.25em] text-ink/55">TO</div>
                <div className="font-display text-[clamp(2.6rem,7vw,4.6rem)] leading-none tracking-tight text-ink">WLD</div>
                <div className="font-mono text-[11px] tracking-[0.15em] text-ink/60">THE WORLD</div>
              </div>
            </div>
            <dl className="mt-6 grid grid-cols-3 gap-x-4 gap-y-4 font-mono text-ink md:grid-cols-4">
              <Field k="PASSENGER" v="CZARTORYSKI / D" wide />
              <Field k="FLIGHT" v="HH 2027" />
              <Field k="SEAT" v="1A" />
              <Field k="DEPARTS" v="06:00" />
              <Field k="COUNTRIES" v="23" />
              <Field k="CLASS" v="FOUNDER" />
            </dl>
          </div>
          <div className="perf-v hidden flex-col items-center justify-between px-5 py-6 md:flex">
            <span className="notch" />
            <div className="font-mono text-[10px] tracking-[0.3em] text-ink/55 [writing-mode:vertical-rl]">BOARDING PASS · 1A</div>
            <div className="barcode h-16 w-full opacity-80" />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onBoard}
        className="group mt-10 inline-flex items-center gap-3 rounded-full bg-gold px-8 py-4 font-mono text-[13px] font-semibold tracking-[0.3em] text-ink shadow-[0_0_0_0_rgba(212,168,83,0.5)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_0_10px_rgba(212,168,83,0.12)]"
      >
        BOARD
        <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
          <Plane size={16} />
        </span>
      </button>
      <div className="mt-4 font-mono text-[11px] tracking-[0.2em] text-fg-dim">SOUND ON · 14 SECONDS</div>

      <button
        type="button"
        onClick={onSkip}
        className="absolute bottom-6 right-6 font-mono text-[11px] tracking-[0.25em] text-fg-dim underline-offset-4 hover:text-paper hover:underline md:bottom-8 md:right-10"
      >
        SKIP INTRO →
      </button>
    </motion.div>
  );
}

function Field({ k, v, wide }: { k: string; v: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="text-[10px] tracking-[0.25em] text-ink/55">{k}</dt>
      <dd className="mt-0.5 text-[13px] font-semibold tracking-[0.08em]">{v}</dd>
    </div>
  );
}

function CodeStrip({ speed }: { speed: number }) {
  const row = [...CODES, ...CODES];
  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 overflow-hidden border-t border-line py-3">
      <div
        className="flex w-max gap-10 font-mono text-[11px] tracking-[0.3em] text-fg-faint"
        style={{ animation: `strip ${28 / speed}s linear infinite` }}
      >
        {row.map((c, i) => (
          <span key={i}>{c}</span>
        ))}
      </div>
    </div>
  );
}

function Stars() {
  // Deterministic so server and client agree.
  const pts = Array.from({ length: 70 }, (_, i) => {
    const x = ((i * 73) % 100) + ((i * 7) % 10) / 10;
    const y = ((i * 41) % 70) + ((i * 3) % 10) / 10;
    const s = 0.6 + ((i * 13) % 5) / 5;
    return { x, y, s, o: 0.25 + ((i * 17) % 6) / 10 };
  });
  return (
    <svg aria-hidden className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.s * 0.12} fill="#f3ead8" opacity={p.o} />
      ))}
    </svg>
  );
}
