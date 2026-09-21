"use client";

import { useIntro } from "./IntroContext";

export default function ReplayIntro() {
  const { replay } = useIntro();
  return (
    <button
      type="button"
      onClick={replay}
      className="font-mono text-[10px] tracking-[0.25em] text-gold underline-offset-4 hover:underline"
    >
      REPLAY BOARDING ↺
    </button>
  );
}
