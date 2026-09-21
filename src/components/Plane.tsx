/** Top-down airliner silhouette, nose pointing right. */
export default function Plane({
  className,
  size = 24,
  fill = "currentColor",
}: {
  className?: string;
  size?: number | string;
  fill?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden
      focusable="false"
    >
      <path
        fill={fill}
        d="M96 50c0-3.2-4.4-5.4-11-6l-27.6-2L33.2 11.4c-1.1-1.4-2.8-2.2-4.6-2.2H25c-1.4 0-2.4 1.4-1.9 2.7l10.4 30H16.9l-6.4-8.6c-.8-1.1-2.1-1.7-3.5-1.7H4.6c-1.3 0-2.2 1.3-1.8 2.5L7.6 50l-4.8 15.9c-.4 1.2.5 2.5 1.8 2.5H7c1.4 0 2.7-.6 3.5-1.7l6.4-8.6h16.6l-10.4 30c-.5 1.3.5 2.7 1.9 2.7h3.6c1.8 0 3.5-.8 4.6-2.2L57.4 58l27.6-2c6.6-.6 11-2.8 11-6z"
      />
    </svg>
  );
}
