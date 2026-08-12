import Svg, { Circle, Line, Polyline } from "react-native-svg";

import { colors } from "@/shared/styles/colors";

const POINTS: [number, number][] = [
  [3.9, 70],
  [39.1, 49],
  [74.3, 40],
  [109.4, 73],
  [144.6, 24],
  [179.8, 41],
  [215.0, 18],
  [258.0, 4]
];

const VIEW_WIDTH = 262;
const VIEW_HEIGHT = 90;
const GRID_LINES = [5, 33.3, 61.6, 90];

type Props = {
  width?: number;
  color?: string;
};

export function HumidityLineChart({ width = 280, color = colors.primary }: Props) {
  const height = (width * VIEW_HEIGHT) / VIEW_WIDTH;
  const polylinePoints = POINTS.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}>
      {GRID_LINES.map((y) => (
        <Line
          key={y}
          x1={0}
          y1={y}
          x2={VIEW_WIDTH}
          y2={y}
          stroke="#D9D5D2"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      ))}
      <Polyline
        points={polylinePoints}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {POINTS.map(([x, y], index) => (
        <Circle key={index} cx={x} cy={y} r={4} fill={color} />
      ))}
    </Svg>
  );
}
