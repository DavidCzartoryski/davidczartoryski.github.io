"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type IntroState = {
  /** True once the boarding sequence has cleared and the site is live. */
  done: boolean;
  setDone: (done: boolean) => void;
  /** Remounts the gate so the sequence can be watched again. */
  replay: () => void;
  replayKey: number;
};

const Ctx = createContext<IntroState | null>(null);

export function IntroProvider({ children }: { children: React.ReactNode }) {
  const [done, setDone] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const replay = useCallback(() => {
    try {
      sessionStorage.removeItem("dc-intro");
    } catch {
      /* ignore */
    }
    setDone(false);
    setReplayKey((k) => k + 1);
    window.scrollTo({ top: 0 });
  }, []);
  const value = useMemo(() => ({ done, setDone, replay, replayKey }), [done, replay, replayKey]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useIntro() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useIntro outside IntroProvider");
  return v;
}
