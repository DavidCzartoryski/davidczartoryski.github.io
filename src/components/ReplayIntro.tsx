"use client";

import { useIntro } from "./IntroContext";
import { flight } from "./three/store";

export default function ReplayIntro() {
  const { replay } = useIntro();
  return (
    <button
      type="button"
      onClick={async () => {
        // With the 3D layer up, fly the camera home along the route first.
        if (flight.active && !flight.reduced && flight.flyHome) await flight.flyHome();
        replay();
      }}
      className="font-mono text-[10px] tracking-[0.25em] text-gold underline-offset-4 hover:underline"
    >
      REPLAY BOARDING ↺
    </button>
  );
}
