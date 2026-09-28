/**
 * The one mutable object the DOM and the 3D layer share.
 *
 * DOM listeners write into it, the render loop reads it every frame, and
 * nothing in here triggers a React render. It carries no three.js import,
 * so components in the main bundle (ReplayIntro) can reach it without
 * pulling the scene in.
 */
export type Station = { id: string; top: number; height: number };

export const flight = {
  /** True once the canvas is up and drawing. */
  active: false,
  reduced: false,
  /** Coarse pointer: cursor effects become idle drift. */
  touch: false,

  scrollY: 0,
  vw: 1,
  vh: 1,
  /** On a portrait screen the text column covers everything, so scenes sit back. */
  get portrait() {
    return this.vw / Math.max(1, this.vh) < 0.9;
  },
  /** Measured document offsets of the seven sections, in page order. */
  stations: [] as Station[],

  /** Pointer in NDC (-1..1), and whether it is over the window. */
  pointer: { x: 0, y: 0, inside: false },

  hold: {
    /** performance.now() when the press started, or 0. */
    start: 0,
    x: 0,
    y: 0,
    /** 0..1, eased by the scene; written back so the DOM ring can read it. */
    progress: 0,
  },
  /** performance.now() when the last board was triggered, or 0. */
  boardedAt: 0,

  hoverStamp: null as string | null,
  hoverVenture: null as string | null,
  /** Flight-log legs (and the origin) that have scrolled into view. */
  legs: [false, false, false, false, false],

  /** Horizontal drag on the globe, in pixels since the last frame read it. */
  globeDrag: { dx: 0, dy: 0, active: false },

  /** Theme song playing: the SOUND toggle is on. */
  soundOn: false,
  /** 0.35..1, lowered by PerformanceMonitor when frames drop. */
  quality: 1,

  /** Route position from scroll (0..7, one unit per section) and its damped value the camera uses. */
  route: 0,
  routeS: 0,
  /** performance.now() when the site was last revealed, so the hero can replay its entrance. */
  introAt: 0,

  /** DOM overlay the render loop writes to directly (hold ring, board hint). */
  dom: { ring: null as HTMLDivElement | null, arc: null as SVGCircleElement | null, hint: null as HTMLDivElement | null },

  /** Wired up by Scene.tsx. */
  board: () => {},
  invalidate: () => {},
  onReady: () => {},
  /** Scrolls home with the camera, then resolves. Null until the scene is up. */
  flyHome: null as null | (() => Promise<void>),
};

export type Flight = typeof flight;
