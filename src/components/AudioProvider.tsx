"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { CRUISE_VOLUME, INTRO_VOLUME, SONG_START } from "@/lib/audio-cues";

type Status = "idle" | "playing" | "paused";

type AudioApi = {
  elRef: RefObject<HTMLAudioElement | null>;
  status: Status;
  /** Seeks to SONG_START and plays at intro volume. Resolves false if the browser refused. */
  start: () => Promise<boolean>;
  /** Play/pause from the floating control. */
  toggle: () => void;
  fadeTo: (volume: number, ms: number) => void;
};

const Ctx = createContext<AudioApi | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const elRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  const fadeTo = useCallback((to: number, ms: number) => {
    const el = elRef.current;
    if (!el) return;
    if (fadeTimer.current) clearInterval(fadeTimer.current);
    const step = 40;
    const from = el.volume;
    const delta = (to - from) / Math.max(1, ms / step);
    fadeTimer.current = setInterval(() => {
      const next = el.volume + delta;
      const finished = delta >= 0 ? next >= to : next <= to;
      el.volume = Math.min(1, Math.max(0, finished ? to : next));
      if (finished && fadeTimer.current) {
        clearInterval(fadeTimer.current);
        fadeTimer.current = null;
      }
    }, step);
  }, []);

  const start = useCallback(async () => {
    const el = elRef.current;
    if (!el) return false;
    try {
      el.currentTime = SONG_START;
      el.volume = INTRO_VOLUME;
      await el.play();
      return true;
    } catch {
      return false;
    }
  }, []);

  const toggle = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    if (!el.paused) {
      fadeTo(0, 500);
      window.setTimeout(() => {
        if (el.volume <= 0.01) el.pause();
      }, 540);
      return;
    }
    if (el.currentTime < SONG_START) el.currentTime = SONG_START;
    el.volume = 0;
    el.play()
      .then(() => fadeTo(CRUISE_VOLUME, 1200))
      .catch(() => setStatus("idle"));
  }, [fadeTo]);

  useEffect(
    () => () => {
      if (fadeTimer.current) clearInterval(fadeTimer.current);
      elRef.current?.pause();
    },
    [],
  );

  const api = useMemo(() => ({ elRef, status, start, toggle, fadeTo }), [status, start, toggle, fadeTo]);

  return (
    <Ctx.Provider value={api}>
      <audio
        ref={elRef}
        src="/audio/theme.mp3"
        preload="auto"
        onPlay={() => setStatus("playing")}
        onPause={() => setStatus("paused")}
        onEnded={() => {
          // Loop back to the boarding point rather than the cold open.
          const el = elRef.current;
          if (!el) return;
          el.currentTime = SONG_START;
          el.play().catch(() => undefined);
        }}
      />
      {children}
    </Ctx.Provider>
  );
}

export function useAudio() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAudio outside AudioProvider");
  return v;
}
