export function GemLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <polygon
        points="16,2 28,10 28,22 16,30 4,22 4,10"
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth="1.5"
      />
      <polygon
        points="16,6 24,12 24,20 16,26 8,20 8,12"
        fill="rgba(212,175,55,0.08)"
        stroke="var(--color-gold)"
        strokeWidth="0.8"
      />
      <line
        x1="16"
        y1="2"
        x2="16"
        y2="30"
        stroke="var(--color-gold)"
        strokeWidth="0.5"
        opacity=".4"
      />
      <line
        x1="4"
        y1="10"
        x2="28"
        y2="22"
        stroke="var(--color-gold)"
        strokeWidth="0.5"
        opacity=".4"
      />
      <line
        x1="28"
        y1="10"
        x2="4"
        y2="22"
        stroke="var(--color-gold)"
        strokeWidth="0.5"
        opacity=".4"
      />
    </svg>
  );
}
