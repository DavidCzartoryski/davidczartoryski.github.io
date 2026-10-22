import { useId } from "react";

/** The crescent that has caught the one red dot. */
export default function Mark({ size = 28, className }: { size?: number; className?: string }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <defs>
        <mask id={id}>
          <rect width="32" height="32" fill="#fff" />
          <circle cx="21.5" cy="12.5" r="10.5" fill="#000" />
        </mask>
      </defs>
      <circle cx="16" cy="16" r="13.5" fill="currentColor" mask={`url(#${id})`} />
      <circle cx="21" cy="13" r="3.2" className="fill-ar-signal" />
    </svg>
  );
}
