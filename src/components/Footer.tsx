import { profile } from "@/data/site";
import ReplayIntro from "./ReplayIntro";

const YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-12 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-display text-2xl tracking-tight">{profile.name}</div>
          <div className="mt-1 font-mono text-[10px] tracking-[0.3em] text-fg-dim">
            BOS · WAW · MXP · © {YEAR}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-6 font-mono text-[10px] tracking-[0.25em] text-fg-dim">
          <span>BUILT WITH NEXT.JS AND MOTION</span>
          <ReplayIntro />
        </div>
      </div>
    </footer>
  );
}
