import Svg, {
  Polygon as SvgPolygon,
  Line as SvgLine,
  PolygonProps,
  LineProps,
} from 'react-native-svg';
import { cssInterop } from 'nativewind';

type WithClassName<T> = T & { className?: string };

const Polygon = SvgPolygon as React.ComponentType<WithClassName<PolygonProps>>;
const Line = SvgLine as React.ComponentType<WithClassName<LineProps>>;

cssInterop(Polygon, {
  className: {
    target: false,
    nativeStyleToProp: { fill: true, stroke: true },
  },
});

cssInterop(Line, {
  className: {
    target: false,
    nativeStyleToProp: { stroke: true },
  },
});

export function GemLogo({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Polygon
        points="16,2 28,10 28,22 16,30 4,22 4,10"
        fill="none"
        className="stroke-gold"
        strokeWidth="1.5"
      />
      <Polygon
        points="16,6 24,12 24,20 16,26 8,20 8,12"
        fill="rgba(212,175,55,0.08)"
        className="stroke-gold"
        strokeWidth="0.8"
      />
      <Line
        x1="16"
        y1="2"
        x2="16"
        y2="30"
        className="stroke-gold opacity-40"
        strokeWidth="0.5"
      />
      <Line
        x1="4"
        y1="10"
        x2="28"
        y2="22"
        className="stroke-gold opacity-40"
        strokeWidth="0.5"
      />
      <Line
        x1="28"
        y1="10"
        x2="4"
        y2="22"
        className="stroke-gold opacity-40"
        strokeWidth="0.5"
      />
    </Svg>
  );
}
