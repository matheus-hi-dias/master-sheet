import {
  gemLogoFacets,
  gemLogoInnerPoints,
  gemLogoOuterPoints,
  gemLogoViewBox,
} from './geometry';
import type { GemLogoProps } from './types';

export function GemLogo({
  size = 32,
  className,
  accessibilityLabel,
  testID,
}: GemLogoProps) {
  const decorative = accessibilityLabel === undefined;

  return (
    <svg
      width={size}
      height={size}
      viewBox={gemLogoViewBox}
      fill="none"
      className={className}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={accessibilityLabel}
      data-testid={testID}
    >
      <polygon
        points={gemLogoOuterPoints}
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth="1.5"
      />
      <polygon
        points={gemLogoInnerPoints}
        fill="var(--color-gold-tint)"
        stroke="var(--color-gold)"
        strokeWidth="0.8"
      />
      {gemLogoFacets.map((facet) => (
        <line
          key={`${facet.x1}-${facet.y1}-${facet.x2}-${facet.y2}`}
          x1={facet.x1}
          y1={facet.y1}
          x2={facet.x2}
          y2={facet.y2}
          stroke="var(--color-gold)"
          strokeWidth="0.5"
          opacity=".4"
        />
      ))}
    </svg>
  );
}
