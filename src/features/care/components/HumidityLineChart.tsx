import Svg, { Circle, Line, Polyline } from "react-native-svg";

import { colors } from "@/shared/styles/colors";

const VIEW_WIDTH = 280;
const VIEW_HEIGHT = 100;
const GRID_LINES = [5, 33.3, 61.6, 90];

type Props = {
  values: number[];
  width?: number;
  color?: string;
  /** 값이 매핑되는 범위 — EnvironmentScreen의 y축 라벨(25~70%)과 맞춰뒀어요. */
  min?: number;
  max?: number;
};

export function HumidityLineChart({
  values,
  width = 280,
  color = colors.primary,
  min = 20,
  max = 75,
}: Props) {
  const height = (width * VIEW_HEIGHT) / VIEW_WIDTH;
  const dotRadius = 4;
  const drawableWidth = VIEW_WIDTH - dotRadius * 2;
  const stepX = values.length > 1 ? drawableWidth / (values.length - 1) : 0;

  const points: [number, number][] = values.map((value, index) => {
    const clamped = Math.min(Math.max(value, min), max);
    const y = VIEW_HEIGHT - ((clamped - min) / (max - min)) * VIEW_HEIGHT;
    return [dotRadius + index * stepX, y];
  });

  const polylinePoints = points.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
    >
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
      {points.map(([x, y], index) => (
        <Circle key={index} cx={x} cy={y} r={4} fill={color} />
      ))}
    </Svg>
  );
}
