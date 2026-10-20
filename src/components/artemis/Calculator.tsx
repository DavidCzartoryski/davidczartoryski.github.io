"use client";

import { useId, useState } from "react";
import { Ticks } from "./bits";

const GPU_STEPS = [64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384];

const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const price = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

function Slider({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const id = useId();
  const p = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="ar-mono text-[10.5px] uppercase tracking-[0.12em] text-ar-faint">
          {label}
        </label>
        <output htmlFor={id} className="ar-mono whitespace-nowrap text-[14px] font-medium tabular-nums text-ar-ink">
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={display}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ar-range mt-3"
        style={{ "--p": `${p}%` } as React.CSSProperties}
      />
    </div>
  );
}

/** Waste from one straggler: s / (1 + s) of every GPU-hour in the job goes to waiting. */
export default function Calculator({ note }: { note: string }) {
  const [gpuIdx, setGpuIdx] = useState(4);
  const [rate, setRate] = useState(2.5);
  const [slow, setSlow] = useState(8);
  const [days, setDays] = useState(30);

  const gpus = GPU_STEPS[gpuIdx];
  const fraction = slow / 100 / (1 + slow / 100);
  const gpuHours = gpus * 24 * days;
  const wastedHours = gpuHours * fraction;
  const wasted = wastedHours * rate;

  return (
    <div className="relative mt-8 grid border border-ar-line-2 bg-ar-card lg:grid-cols-12">
      <Ticks />
      <div className="grid gap-8 p-6 sm:grid-cols-2 md:p-8 lg:col-span-7 lg:border-r lg:border-ar-line">
        <Slider
          label="GPUs in the job"
          value={gpuIdx}
          display={whole.format(gpus)}
          min={0}
          max={GPU_STEPS.length - 1}
          step={1}
          onChange={setGpuIdx}
        />
        <Slider label="Price per GPU-hour" value={rate} display={price.format(rate)} min={1} max={8} step={0.25} onChange={setRate} />
        <Slider label="Straggler slowdown" value={slow} display={`${slow}%`} min={1} max={30} step={1} onChange={setSlow} />
        <Slider
          label="Days unnoticed"
          value={days}
          display={`${days} ${days === 1 ? "day" : "days"}`}
          min={1}
          max={90}
          step={1}
          onChange={setDays}
        />
        <p className="text-[13px] leading-relaxed text-ar-faint sm:col-span-2">{note}</p>
      </div>
      <div className="flex flex-col justify-between gap-8 border-t border-ar-line p-6 md:p-8 lg:col-span-5 lg:border-t-0" aria-live="polite">
        <div>
          <p className="ar-mono text-[10.5px] uppercase tracking-[0.12em] text-ar-faint">Spent waiting for one GPU</p>
          <p className="ar-display mt-3 text-[clamp(2.6rem,5vw,4rem)] leading-none tabular-nums text-ar-ink">{money.format(wasted)}</p>
        </div>
        <div>
          <div className="flex h-3 overflow-hidden rounded-[2px] bg-ar-ink/10" aria-hidden="true">
            <div className="bg-ar-signal transition-[width] duration-300" style={{ width: `${fraction * 100}%` }} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-[14px]">
            <div>
              <dt className="text-ar-faint">GPU-hours idle</dt>
              <dd className="ar-mono mt-1 tabular-nums text-ar-ink">{whole.format(wastedHours)}</dd>
            </div>
            <div>
              <dt className="text-ar-faint">Same as leaving idle</dt>
              <dd className="ar-mono mt-1 tabular-nums text-ar-ink">{whole.format(gpus * fraction)} GPUs</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
