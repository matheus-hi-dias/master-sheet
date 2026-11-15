import type { ComponentType } from 'react';

export interface GemLogoProps {
  size?: number;
  className?: string;
  /** When provided the logo is exposed as an image with this accessible name. */
  accessibilityLabel?: string;
  testID?: string;
}

export declare const GemLogo: ComponentType<GemLogoProps>;
