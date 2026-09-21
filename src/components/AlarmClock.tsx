"use client";

/**
 * Twin-bell alarm clock, drawn in the site's cream ink. The second hand is
 * driven by `seconds` (elapsed since boarding) so it ticks with the song.
 * `ringing` turns on the bell/hammer/shake keyframes from globals.css.
 */
export default function AlarmClock({
  seconds,
  ringing,
  tension = 0,
}: {
  seconds: number;
  ringing: boolean;
  /** 0..1, how close the build-up is to the buzzer. Lights up the face. */
  tension?: number;
}) {
  const sec = Math.floor(seconds) % 60;
  const secAngle = sec * 6;
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  const ink = "var(--paper)";
  const dim = "rgba(243,234,216,0.35)";
  const hot = `rgba(212,168,83,${0.25 + tension * 0.75})`;

  return (
    <svg
      viewBox="0 0 400 400"
      className={`h-full w-full ${ringing ? "ringing" : ""}`}
      aria-hidden
    >
      {/* radiating rings while ringing */}
      {ringing && (
        <g fill="none" stroke="var(--gold)" strokeWidth="2">
          <circle cx="200" cy="215" r="150" className="ring-out" />
          <circle cx="200" cy="215" r="150" className="ring-out" style={{ animationDelay: "230ms" }} />
          <circle cx="200" cy="215" r="150" className="ring-out" style={{ animationDelay: "460ms" }} />
        </g>
      )}

      <g className="clock-body">
        {/* bells */}
        <g className="bell-l">
          <path d="M76 100 A42 42 0 0 1 160 100 Z" fill="var(--ink-3)" stroke={ink} strokeWidth="5" strokeLinejoin="round" />
          <circle cx="118" cy="52" r="7" fill={ink} />
          <line x1="118" y1="59" x2="118" y2="72" stroke={ink} strokeWidth="5" />
          <line x1="128" y1="104" x2="152" y2="132" stroke={ink} strokeWidth="6" strokeLinecap="round" />
        </g>
        <g className="bell-r">
          <path d="M240 100 A42 42 0 0 1 324 100 Z" fill="var(--ink-3)" stroke={ink} strokeWidth="5" strokeLinejoin="round" />
          <circle cx="282" cy="52" r="7" fill={ink} />
          <line x1="282" y1="59" x2="282" y2="72" stroke={ink} strokeWidth="5" />
          <line x1="272" y1="104" x2="248" y2="132" stroke={ink} strokeWidth="6" strokeLinecap="round" />
        </g>
        {/* hammer */}
        <g className="hammer">
          <line x1="200" y1="82" x2="200" y2="112" stroke={ink} strokeWidth="5" strokeLinecap="round" />
          <circle cx="200" cy="74" r="10" fill={ink} />
        </g>

        {/* legs */}
        <g stroke={ink} strokeWidth="7" strokeLinecap="round">
          <line x1="140" y1="335" x2="112" y2="382" />
          <line x1="260" y1="335" x2="288" y2="382" />
          <line x1="100" y1="384" x2="124" y2="384" />
          <line x1="276" y1="384" x2="300" y2="384" />
        </g>

        {/* body */}
        <circle cx="200" cy="215" r="132" fill="var(--ink-2)" stroke={ink} strokeWidth="7" />
        <circle cx="200" cy="215" r="118" fill="var(--ink)" stroke={dim} strokeWidth="1.5" />
        <circle cx="200" cy="215" r="112" fill="none" stroke={hot} strokeWidth="2" />

        {/* ticks */}
        <g>
          {ticks.map((i) => {
            const major = i % 5 === 0;
            const a = (i * 6 * Math.PI) / 180;
            const r1 = major ? 96 : 104;
            const r2 = 110;
            return (
              <line
                key={i}
                x1={200 + r1 * Math.sin(a)}
                y1={215 - r1 * Math.cos(a)}
                x2={200 + r2 * Math.sin(a)}
                y2={215 - r2 * Math.cos(a)}
                stroke={major ? ink : dim}
                strokeWidth={major ? 3 : 1.5}
                strokeLinecap="round"
                opacity={i <= tension * 60 ? 1 : 0.55}
              />
            );
          })}
        </g>
        {/* numerals */}
        <g fill={ink} fontFamily="var(--font-mono)" fontSize="20" fontWeight="600" textAnchor="middle">
          <text x="200" y="138">12</text>
          <text x="288" y="222">3</text>
          <text x="200" y="306">6</text>
          <text x="112" y="222">9</text>
        </g>

        {/* hands: 06:00 */}
        <line x1="200" y1="215" x2="200" y2="278" stroke={ink} strokeWidth="8" strokeLinecap="round" />
        <line x1="200" y1="215" x2="200" y2="126" stroke={ink} strokeWidth="6" strokeLinecap="round" />
        <g transform={`rotate(${secAngle} 200 215)`} style={{ transition: "transform 120ms cubic-bezier(.3,1.6,.5,1)" }}>
          <line x1="200" y1="240" x2="200" y2="112" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" />
        </g>
        <circle cx="200" cy="215" r="7" fill="var(--gold)" />
      </g>
    </svg>
  );
}
