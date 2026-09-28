"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useIntro } from "../IntroContext";
import { flight } from "./store";

// The whole 3D layer (three, fiber, drei, every scene) lives behind this import.
const Scene = dynamic(() => import("./Scene"), { ssr: false, loading: () => null });

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * "Night flight": one fixed canvas behind the page. Nothing here renders on
 * the server or before the boarding intro clears; without WebGL (or with
 * data saver on) it never loads and the site stays exactly as it was.
 */
export default function NightFlight() {
  const { done } = useIntro();
  const [load, setLoad] = useState(false);

  useEffect(() => {
    if (!done || load) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData || !webglAvailable()) return;
    flight.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    flight.touch = window.matchMedia("(pointer: coarse)").matches;
    // After first paint and whatever the intro reveal is doing.
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const id = idle(() => setLoad(true), { timeout: 2500 });
    return () => cancel(id);
  }, [done, load]);

  if (!load) return null;
  return <Scene />;
}
