import type { ComponentType } from 'react';

export interface DotTrackerProps {
  /** Controlled value in the range `0..maxDots`. */
  value: number;
  maxDots: number;
  onChange: (value: number) => void;
  className?: string;
  testID?: string;
}

export declare const DotTracker: ComponentType<DotTrackerProps>;
