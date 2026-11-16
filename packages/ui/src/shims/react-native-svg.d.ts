declare module 'react-native-svg' {
  import type { ComponentType, ReactNode } from 'react';

  export interface SvgProps {
    width?: number;
    height?: number;
    viewBox?: string;
    className?: string;
    accessible?: boolean;
    accessibilityRole?: string;
    accessibilityLabel?: string;
    importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
    testID?: string;
    children?: ReactNode;
  }

  export interface PolygonProps {
    points?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  }

  export interface LineProps {
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
  }

  const Svg: ComponentType<SvgProps>;
  export default Svg;
  export const Polygon: ComponentType<PolygonProps>;
  export const Line: ComponentType<LineProps>;
}
