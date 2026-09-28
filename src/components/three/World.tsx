"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei/core/PerformanceMonitor";
import { type PerspectiveCamera, Vector3 } from "three";
import { BRASS_2, FOG_DENSITY, INK, PAPER, clamp01, damp } from "./lib";
import { keyframes, poseAt, routeFromScroll } from "./route";
import { flight } from "./store";
import CargoHold from "./scenes/CargoHold";
import FlightPath from "./scenes/FlightPath";
import Globe from "./scenes/Globe";
import MatScene from "./scenes/Mat";
import Photos from "./scenes/Photos";
import Runway from "./scenes/Runway";
import Sky from "./scenes/Sky";

/** Camera: scroll picks a spot on the route, damping turns jumps into flights. */
function Rig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const keys = useMemo(() => keyframes(size.width / Math.max(1, size.height)), [size.width, size.height]);
  const pos = useMemo(() => new Vector3(), []);
  const look = useMemo(() => new Vector3(), []);
  const par = useRef({ x: 0, y: 0 });
  const first = useRef(true);

  useFrame((state, dt) => {
    const r = routeFromScroll();
    flight.route = r;
    if (first.current || flight.reduced) {
      flight.routeS = r;
      first.current = false;
    } else {
      // Slower over long jumps so REPLAY BOARDING reads as a flight home, not a cut.
      const lambda = Math.abs(r - flight.routeS) > 1.5 ? 2.2 : 3.6;
      flight.routeS = damp(flight.routeS, r, lambda, Math.min(dt, 0.1));
    }
    let fov = poseAt(keys, flight.routeS, pos, look, flight.reduced);

    if (!flight.reduced) {
      // A touch of parallax from the cursor; on touch screens a slow idle sway.
      const t = state.clock.elapsedTime;
      const tx = flight.touch ? Math.sin(t * 0.21) * 0.4 : flight.pointer.inside ? flight.pointer.x : 0;
      const ty = flight.touch ? Math.sin(t * 0.17 + 1) * 0.25 : flight.pointer.inside ? flight.pointer.y : 0;
      par.current.x = damp(par.current.x, tx, 2, dt);
      par.current.y = damp(par.current.y, ty, 2, dt);
      pos.x += par.current.x * 0.45;
      pos.y += par.current.y * 0.28;
      // The dive after boarding: a quick FOV punch that settles.
      const since = (performance.now() - flight.boardedAt) / 1000;
      if (flight.boardedAt && since < 1.6) fov += Math.sin(Math.PI * clamp01(since / 1.6)) * 16;
    }
    camera.position.copy(pos);
    camera.lookAt(look);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

/** Signals the DOM once the first frame is on screen, so the canvas can fade in. */
function Ready() {
  const sent = useRef(false);
  useFrame(() => {
    if (sent.current) return;
    sent.current = true;
    requestAnimationFrame(() => flight.onReady());
  });
  return null;
}

function Invalidator() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    flight.invalidate = () => invalidate();
    return () => {
      flight.invalidate = () => {};
    };
  }, [invalidate]);
  return null;
}

export default function World() {
  const setDpr = useThree((s) => s.setDpr);
  const maxDpr = flight.touch ? 1 : 1.5;
  return (
    <>
      <color attach="background" args={[INK]} />
      <fogExp2 attach="fog" args={[INK, FOG_DENSITY]} />
      <hemisphereLight args={[PAPER, INK, 1.1]} />
      <directionalLight position={[6, 10, 8]} intensity={1.8} color={BRASS_2} />
      <PerformanceMonitor
        flipflops={3}
        onDecline={() => {
          flight.quality = Math.max(0.35, flight.quality * 0.7);
          setDpr(Math.max(1, maxDpr * flight.quality));
        }}
        onIncline={() => {
          flight.quality = Math.min(1, flight.quality / 0.7);
          setDpr(Math.max(1, maxDpr * flight.quality));
        }}
        onFallback={() => {
          flight.quality = 0.35;
          setDpr(1);
        }}
      />
      <Invalidator />
      <Rig />
      <Sky />
      <Globe />
      <FlightPath />
      <CargoHold />
      <MatScene />
      <Photos />
      <Runway />
      <Ready />
    </>
  );
}
