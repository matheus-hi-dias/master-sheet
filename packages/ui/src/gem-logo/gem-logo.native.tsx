import { useColorScheme } from 'react-native';
import Svg, { Line, Polygon } from 'react-native-svg';

import { colorTokens } from '@master-sheet/design-tokens/tokens';

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
  const scheme = useColorScheme() === 'light' ? 'light' : 'dark';
  const palette = colorTokens[scheme];
  const decorative = accessibilityLabel === undefined;

  return (
    <Svg
      width={size}
      height={size}
      viewBox={gemLogoViewBox}
      className={className}
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : 'image'}
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={decorative ? 'no' : 'yes'}
      testID={testID}
    >
      <Polygon
        points={gemLogoOuterPoints}
        fill="none"
        stroke={palette.gold}
        strokeWidth={1.5}
      />
      <Polygon
        points={gemLogoInnerPoints}
        fill={palette.goldTint}
        stroke={palette.gold}
        strokeWidth={0.8}
      />
      {gemLogoFacets.map((facet) => (
        <Line
          key={`${facet.x1}-${facet.y1}-${facet.x2}-${facet.y2}`}
          x1={facet.x1}
          y1={facet.y1}
          x2={facet.x2}
          y2={facet.y2}
          stroke={palette.gold}
          strokeWidth={0.5}
          opacity={0.4}
        />
      ))}
    </Svg>
  );
}
