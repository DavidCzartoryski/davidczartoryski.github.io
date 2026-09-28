"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
} from "three";
import { cargo } from "@/data/site";
import { BRASS, BRASS_2, INK_2, INK_3, PAPER, RED, damp, hullGeometry, outlineMaterial } from "../lib";
import { WORLD, weight } from "../route";
import { flight } from "../store";

const SLOTS: [number, number][] = [
  [-4.3, 0.2],
  [-1.45, -1.3],
  [1.45, 0.5],
  [4.4, -0.9],
];
const GPUS = 8;
const STRAGGLER = 5;

/** Fuselage ribs and a deck grid, drawn as faint lines. */
function holdLines() {
  const pts: number[] = [];
  for (let k = 0; k < 8; k++) {
    const z = -14 + k * 3;
    let last: number[] | null = null;
    for (let i = 0; i <= 24; i++) {
      const a = Math.PI * (i / 24);
      const p = [Math.cos(a) * 11, Math.sin(a) * 7.5 - 0.6, z];
      if (last) pts.push(...last, ...p);
      last = p;
    }
  }
  for (let x = -12; x <= 12; x += 2) pts.push(x, -0.6, -14, x, -0.6, 8);
  for (let z = -14; z <= 8; z += 2) pts.push(-12, -0.6, z, 12, -0.6, z);
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pts), 3));
  return g;
}

function outlined(geo: BufferGeometry, mat: MeshLambertMaterial | MeshBasicMaterial, hull: ReturnType<typeof outlineMaterial>) {
  const m = new Mesh(geo, mat);
  m.add(new Mesh(hullGeometry(geo), hull));
  return m;
}

function buildCrate(mats: ReturnType<typeof useMats>, straggler: boolean) {
  const crate = new Group();
  if (!straggler) {
    crate.add(outlined(new BoxGeometry(1.7, 1.15, 1.15), mats.wood, mats.hull));
    // slats and a strap
    for (const y of [-0.3, 0.3]) {
      const slat = new Mesh(new BoxGeometry(1.74, 0.12, 1.19), mats.slat);
      slat.position.y = y;
      crate.add(slat);
    }
    const strap = new Mesh(new BoxGeometry(0.12, 1.2, 1.2), mats.strap);
    strap.position.x = 0.45;
    crate.add(strap);
  } else {
    // HH-004: a pallet carrying a row of GPUs.
    const pallet = outlined(new BoxGeometry(2.3, 0.18, 1.2), mats.wood, mats.hull);
    pallet.position.y = -0.5;
    crate.add(pallet);
    const leds: MeshBasicMaterial[] = [];
    for (let i = 0; i < GPUS; i++) {
      const x = -1.0 + (i * 2.0) / (GPUS - 1);
      const block = outlined(new BoxGeometry(0.2, 0.62, 0.9), mats.gpu, mats.hull);
      block.position.set(x, -0.08, 0);
      crate.add(block);
      const led = new MeshBasicMaterial({ color: i === STRAGGLER ? RED : BRASS_2, transparent: true });
      const strip = new Mesh(new BoxGeometry(0.21, 0.07, 0.6), led);
      strip.position.set(x, 0.16, 0.18);
      crate.add(strip);
      leds.push(led);
    }
    crate.userData.leds = leds;
  }
  // luggage tag on a short cord
  const tag = new Group();
  const card = outlined(new BoxGeometry(0.34, 0.56, 0.02), mats.tag, mats.hull);
  card.position.y = -0.3;
  tag.add(card);
  const cord = new LineSegments(
    new BufferGeometry().setAttribute("position", new BufferAttribute(new Float32Array([0, 0.16, 0, 0, -0.02, 0]), 3)),
    mats.cord,
  );
  tag.add(cord);
  tag.position.set(straggler ? 1.2 : 0.86, straggler ? 0.1 : 0.45, 0.6);
  crate.add(tag);
  crate.userData.tag = tag;
  return crate;
}

function useMats() {
  return useMemo(
    () => ({
      wood: new MeshLambertMaterial({ color: "#8a6a3e", flatShading: true }),
      slat: new MeshLambertMaterial({ color: "#6b5030", flatShading: true }),
      strap: new MeshLambertMaterial({ color: INK_3, flatShading: true }),
      gpu: new MeshLambertMaterial({ color: "#2a3558", flatShading: true }),
      tag: new MeshLambertMaterial({ color: PAPER, flatShading: true, side: DoubleSide }),
      cord: new LineBasicMaterial({ color: PAPER, transparent: true, opacity: 0.6 }),
      lines: new LineBasicMaterial({ color: BRASS, transparent: true, opacity: 0.1, depthWrite: false }),
      floor: new MeshLambertMaterial({ color: INK_2 }),
      hull: outlineMaterial(undefined, 0.03),
    }),
    [],
  );
}

export default function CargoHold() {
  const root = useRef<Group>(null);
  const mats = useMats();
  const lines = useMemo(() => holdLines(), []);
  const floorGeo = useMemo(() => new PlaneGeometry(30, 26).rotateX(-Math.PI / 2), []);
  const crates = useMemo(() => cargo.map((c) => buildCrate(mats, c.id === "straggler")), [mats]);
  const lift = useRef(crates.map(() => 0));

  useFrame((state, dt) => {
    const w = weight(3, flight.routeS);
    const g = root.current!;
    g.visible = w > 0.002;
    if (!g.visible) return;
    const t = flight.reduced ? 0 : state.clock.elapsedTime;
    mats.lines.opacity = 0.1 * w;

    crates.forEach((crate, i) => {
      const hovered = flight.hoverVenture === cargo[i].id;
      lift.current[i] = flight.reduced ? (hovered ? 1 : 0) : damp(lift.current[i], hovered ? 1 : 0, 5, dt);
      const L = lift.current[i];
      const [x, z] = SLOTS[i];
      crate.position.set(x, 0.55 + Math.sin(t * 0.8 + i * 1.7) * 0.08 + L * 1.0, z);
      crate.rotation.set(-0.12 * L + Math.sin(t * 0.6 + i) * 0.02, -0.25 + i * 0.18 + L * 0.2, 0.14 * L);
      const tag = crate.userData.tag as Group;
      tag.rotation.z = Math.sin(t * 1.3 + i * 2) * 0.12 + L * 0.3;

      // HH-004: every GPU pulses on the same beat except the straggler, which lags.
      const leds = crate.userData.leds as MeshBasicMaterial[] | undefined;
      if (leds) {
        leds.forEach((m, k) => {
          const phase = k === STRAGGLER ? 1.35 : 0;
          const beat = Math.pow(0.5 + 0.5 * Math.sin(t * 3.2 - phase), 3);
          m.opacity = flight.reduced ? 0.8 : 0.25 + 0.75 * beat;
        });
      }
    });
  });

  return (
    <group ref={root} position={WORLD.hold} visible={false}>
      <mesh geometry={floorGeo} material={mats.floor} position={[0, -0.62, -2]} />
      <lineSegments geometry={lines} material={mats.lines} />
      {crates.map((c, i) => (
        <primitive key={i} object={c} />
      ))}
    </group>
  );
}
