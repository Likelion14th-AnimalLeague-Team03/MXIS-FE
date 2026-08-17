import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from "react-native-svg";

import { colors } from "@/shared/styles/colors";

const VIEW_WIDTH = 300;
const VIEW_HEIGHT = 120;
const LABEL_COL_WIDTH = 40;
const PLOT_LEFT = LABEL_COL_WIDTH + 6;
const PLOT_RIGHT = VIEW_WIDTH - 6;
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;
const PADDING_Y = 12;

const RECOMMENDED_GREEN = "#3F8F5D";
const RECOMMENDED_BAND_FILL = "#E7F2E9";
const AXIS_GRAY = "#9C968F";

type Props = {
  /** 빈 배열이면 점/선 없이 축과 권장 범위 밴드만 그려요 (데이터 수집중 상태용). */
  values: number[];
  width?: number;
  color?: string;
  /** 그래프 y축 최소/최대값 — 보통 데이터 최소값-5 ~ 최대값+5로 넘겨주세요. */
  min: number;
  max: number;
  /**
   * 권장 범위 (예: 습도 45~55%, 온도 18~20°C) — 연두색 밴드 + 초록 라벨로 강조돼요.
   * 안 넘기면(데이터 수집중 등) 강조 없이 4등분한 기본 그래프만 그려요.
   */
  recommendedMin?: number;
  recommendedMax?: number;
  unit?: string;
};

export function HumidityLineChart({
  values,
  width = 300,
  color = colors.primary,
  min,
  max,
  recommendedMin,
  recommendedMax,
  unit = "",
}: Props) {
  const height = (width * VIEW_HEIGHT) / VIEW_WIDTH;
  const range = Math.max(max - min, 1);
  const plotHeight = VIEW_HEIGHT - PADDING_Y * 2;

  const yFor = (value: number) => {
    const clamped = Math.min(Math.max(value, min), max);
    return PADDING_Y + (1 - (clamped - min) / range) * plotHeight;
  };

  const stepX = values.length > 1 ? PLOT_WIDTH / (values.length - 1) : 0;
  const points: [number, number][] = values.map((value, index) => [
    PLOT_LEFT + index * stepX,
    yFor(value),
  ]);
  const polylinePoints = points.map(([x, y]) => `${x},${y}`).join(" ");

  const hasRecommended = recommendedMin != null && recommendedMax != null;

  let axisRows: { value: number; accent: boolean }[];
  if (hasRecommended) {
    // 위/아래 칸이 휑해 보이지 않게, max~권장상단 사이와 권장하단~min 사이에도
    // 중간값을 계산해서 보조 점선을 하나씩 더 넣어요.
    const midUpper = (max + recommendedMax) / 2;
    const midLower = (recommendedMin + min) / 2;

    axisRows = [
      { value: max, accent: false },
      ...(midUpper > recommendedMax ? [{ value: midUpper, accent: false }] : []),
      { value: recommendedMax, accent: true },
      { value: recommendedMin, accent: true },
      ...(midLower < recommendedMin ? [{ value: midLower, accent: false }] : []),
      { value: min, accent: false },
    ];
  } else {
    // 권장 범위가 없을 땐(데이터 수집중) 강조 없이 4등분한 기본 눈금만 보여줘요.
    const step = (max - min) / 3;
    axisRows = [
      { value: max, accent: false },
      { value: max - step, accent: false },
      { value: min + step, accent: false },
      { value: min, accent: false },
    ];
  }

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}>
      {hasRecommended ? (
        <Rect
          x={PLOT_LEFT}
          y={yFor(recommendedMax)}
          width={PLOT_WIDTH}
          height={Math.max(yFor(recommendedMin) - yFor(recommendedMax), 0)}
          fill={RECOMMENDED_BAND_FILL}
        />
      ) : null}
      {axisRows.map((row) => (
        <Line
          key={`grid-${row.value}`}
          x1={PLOT_LEFT}
          y1={yFor(row.value)}
          x2={PLOT_RIGHT}
          y2={yFor(row.value)}
          stroke="#D9D5D2"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      ))}
      {axisRows.map((row) => (
        <SvgText
          key={`label-${row.value}`}
          x={0}
          y={yFor(row.value) + 4}
          fontSize={11}
          fontWeight={row.accent ? "700" : "400"}
          fill={row.accent ? RECOMMENDED_GREEN : AXIS_GRAY}
        >
          {`${Math.round(row.value)}${unit}`}
        </SvgText>
      ))}
      {values.length > 0 ? (
        <>
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
        </>
      ) : null}
    </Svg>
  );
}
