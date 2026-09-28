"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace, TextureLoader } from "three";
import { allPhotos } from "@/lib/photos";
import { PAPER, damp } from "../lib";
import { WORLD, weight } from "../route";
import { flight } from "../store";

// Two frames from each country with film, so the prints cover the whole trip.
const PICKS = [0, 4, 8, 12, 15, 18, 21, 23];
// Around the edges of the frame, at different depths, clear of the text column.
const SPOTS: [number, number, number, number][] = [
  [-8.6, 3.1, -1.0, 2.6],
  [-9.6, -2.1, 1.4, 2.3],
  [-5.4, -5.0, -3.0, 2.8],
  [7.9, 3.5, -2.0, 2.9],
  [9.3, -1.3, 1.0, 2.4],
  [6.1, -5.3, -1.5, 2.6],
  [-2.6, 5.6, -5.0, 2.2],
  [2.9, -6.8, -4.0, 2.4],
];

export default function Photos() {
  const root = useRef<Group>(null);
  const loaded = useRef(false);
  const tilt = useRef({ x: 0, y: 0 });
  const prints = useMemo(() => {
    return PICKS.map((pi, i) => {
      // Each print fades in on its own as its texture arrives.
      const border = new MeshBasicMaterial({ color: PAPER, transparent: true, opacity: 0 });
      const photo = allPhotos[pi] ?? allPhotos[i % allPhotos.length];
      const [x, y, z, h] = SPOTS[i];
      const w = h * (photo.w / photo.h);
      const g = new Group();
      const frameGeo = new PlaneGeometry(w + 0.22, h + 0.22);
      const frame = new Mesh(frameGeo, border);
      const mat = new MeshBasicMaterial({ transparent: true, opacity: 0, color: "#ffffff" });
      const img = new Mesh(new PlaneGeometry(w, h), mat);
      img.position.z = 0.01;
      g.add(frame, img);
      g.position.set(x, y, z);
      g.rotation.z = ((i * 37) % 11) / 100 - 0.05;
      g.userData = { base: [x, y, z], mat, border, src: photo.thumb, depth: z, spin: g.rotation.z };
      return g;
    });
  }, []);

  useFrame((state, dt) => {
    const rs = flight.routeS;
    // Start fetching the thumbnails as the visitor reaches the mat, one stop early.
    if (!loaded.current && rs > 4.3) {
      loaded.current = true;
      const loader = new TextureLoader();
      for (const p of prints) {
        loader.load(p.userData.src as string, (tex) => {
          tex.colorSpace = SRGBColorSpace;
          const m = p.userData.mat as MeshBasicMaterial;
          m.map = tex;
          m.needsUpdate = true;
          p.userData.ready = true;
          flight.invalidate();
        });
      }
    }
    const w = weight(5, rs);
    const g = root.current!;
    g.visible = w > 0.002;
    if (!g.visible) return;
    const t = flight.reduced ? 0 : state.clock.elapsedTime;
    const f = rs - 5.5;
    const px = flight.touch || !flight.pointer.inside ? Math.sin(t * 0.2) * 0.3 : flight.pointer.x;
    const py = flight.touch || !flight.pointer.inside ? Math.cos(t * 0.17) * 0.2 : flight.pointer.y;
    tilt.current.x = damp(tilt.current.x, flight.reduced ? 0 : px, 3, dt);
    tilt.current.y = damp(tilt.current.y, flight.reduced ? 0 : py, 3, dt);

    for (const p of prints) {
      const [x, y, z] = p.userData.base as number[];
      const depth = p.userData.depth as number;
      // Nearer prints slide further as the section scrolls: parallax.
      p.position.set(x, y - f * (3 + depth * 0.6) + Math.sin(t * 0.5 + x) * 0.08, z);
      p.rotation.set(-tilt.current.y * 0.3, tilt.current.x * 0.4, p.userData.spin as number);
      const shown = p.userData.ready ? 1 : 0;
      const m = p.userData.mat as MeshBasicMaterial;
      m.opacity = damp(m.opacity, shown * w, 3, dt);
      (p.userData.border as MeshBasicMaterial).opacity = m.opacity * 0.92;
    }
  });

  return (
    <group ref={root} position={WORLD.photos} visible={false}>
      {prints.map((p, i) => (
        <primitive key={i} object={p} />
      ))}
    </group>
  );
}
