import {
  BoxGeometry,
  type BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  SphereGeometry,
} from "three";
import { BRASS, INK_3, PAPER, RED, hullGeometry, outlineMaterial } from "./lib";

/**
 * A swept, tapered surface: a thin box whose vertices are pulled into a
 * trapezoid. Span runs along +z (or -z for side -1), sweep pushes the tip aft.
 */
function wing(root: number, tip: number, span: number, sweep: number, thick: number, side: 1 | -1) {
  const g = new BoxGeometry(1, thick, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const s = p.getZ(i) + 0.5; // 0 at the root, 1 at the tip
    const chord = root + (tip - root) * s;
    p.setX(i, p.getX(i) * chord - s * sweep);
    p.setZ(i, side * s * span);
    p.setY(i, p.getY(i) * (1 - s * 0.5));
  }
  // Mirroring flips the winding; swap it back so the far wing is not inside out.
  if (side < 0 && g.index) {
    const ix = g.index.array as Uint16Array;
    for (let i = 0; i < ix.length; i += 3) [ix[i + 1], ix[i + 2]] = [ix[i + 2], ix[i + 1]];
  }
  g.computeVertexNormals();
  return g;
}

/** A small airliner from primitives: nose along +x, wings along z. */
export function buildPlane() {
  const plane = new Group();
  const heading = new Group();
  const bank = new Group();
  plane.add(heading);
  heading.add(bank);
  plane.userData.heading = heading;
  plane.userData.bank = bank;
  const body = new MeshLambertMaterial({ color: PAPER, flatShading: true });
  const brass = new MeshLambertMaterial({ color: BRASS, flatShading: true });
  const red = new MeshLambertMaterial({ color: RED, flatShading: true });
  const ink = new MeshLambertMaterial({ color: INK_3, flatShading: true });
  const hull = outlineMaterial(undefined, 0.028);
  const add = (geo: BufferGeometry, mat: MeshLambertMaterial, p: [number, number, number], r: [number, number, number] = [0, 0, 0]) => {
    const m = new Mesh(geo, mat);
    m.position.set(...p);
    m.rotation.set(...r);
    const o = new Mesh(hullGeometry(geo), hull);
    m.add(o);
    bank.add(m);
    return m;
  };
  const halfPi = Math.PI / 2;
  add(new CylinderGeometry(0.17, 0.17, 1.5, 10), body, [0, 0, 0], [0, 0, halfPi]);
  add(new ConeGeometry(0.17, 0.42, 10), body, [0.96, 0, 0], [0, 0, -halfPi]);
  add(new ConeGeometry(0.17, 0.62, 10), body, [-1.06, 0.04, 0], [0, 0, halfPi]);
  // swept, tapered wings with an engine under each, and a matching tailplane
  for (const side of [-1, 1] as const) {
    add(wing(0.62, 0.2, 1.4, 0.62, 0.05, side), body, [0.18, -0.06, side * 0.12]);
    add(new CylinderGeometry(0.07, 0.06, 0.34, 8), brass, [0.14, -0.15, side * 0.62], [0, 0, halfPi]);
    add(wing(0.34, 0.14, 0.5, 0.26, 0.03, side), body, [-0.95, 0.06, side * 0.06]);
  }
  // tail fin in the one accent colour: Hercules Air livery
  const fin = wing(0.46, 0.18, 0.5, 0.34, 0.035, 1);
  fin.rotateX(-halfPi);
  add(fin, red, [-0.96, 0.1, 0]);
  // cockpit band
  add(new CylinderGeometry(0.172, 0.172, 0.08, 10), ink, [0.72, 0.0, 0], [0, 0, halfPi]);
  const beacon = new Mesh(new SphereGeometry(0.035, 6, 6), new MeshBasicMaterial({ color: RED, toneMapped: false }));
  beacon.position.set(-0.2, 0.19, 0);
  bank.add(beacon);
  plane.userData.beacon = beacon;
  return plane;
}

