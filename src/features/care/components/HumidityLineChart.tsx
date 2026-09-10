import Svg, {
  Circle,
  Line,
  Polyline,
  Rect,
  Text as SvgText,
} from "react-native-svg";

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
  values: Array<number | null | undefined>;
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
  const pointSlots = values.length;

  const yFor = (value: number) => {
    const clamped = Math.min(Math.max(value, min), max);
    return PADDING_Y + (1 - (clamped - min) / range) * plotHeight;
  };

  const stepX = pointSlots > 1 ? PLOT_WIDTH / (pointSlots - 1) : 0;
  const points: Array<[number, number] | null> = values.map((value, index) => {
    if (value == null) {
      return null;
    }

    return [PLOT_LEFT + index * stepX, yFor(value)];
  });
  const visiblePoints = points.filter(
    (point): point is [number, number] => point != null,
  );

  const pointSegments: Array<Array<[number, number]>> = [];
  let currentSegment: Array<[number, number]> = [];
  points.forEach((point) => {
    if (!point) {
      if (currentSegment.length > 0) {
        pointSegments.push(currentSegment);
        currentSegment = [];
      }
      return;
    }

    currentSegment.push(point);
  });
  if (currentSegment.length > 0) {
    pointSegments.push(currentSegment);
  }

  const hasRecommended = recommendedMin != null && recommendedMax != null;

  // 마지막 실측값을 선 끝에 배지로 띄워요 (Figma: #814C27, radius 3, 흰 글씨).
  const lastValue = [...values]
    .reverse()
    .find((value): value is number => typeof value === "number");
  const lastPoint =
    visiblePoints.length > 0 ? visiblePoints[visiblePoints.length - 1] : null;
  const finalBadge =
    lastPoint && lastValue != null
      ? (() => {
          const label = `${Math.round(lastValue)}${unit}`;
          const width = label.length * 8 + 14;
          const height = 21;
          const GAP = 7;
          const [pointX, pointY] = lastPoint;
          // 배지가 그래프 밖으로 잘리지 않도록 좌우를 클램프해요.
          const x = Math.min(
            Math.max(pointX - width / 2, 0),
            VIEW_WIDTH - width,
          );
          // 기본은 점 위쪽이지만, 위에 자리가 없으면 점을 가리지 않게 아래로 내려요.
          const above = pointY - height - GAP;
          const y =
            above >= 0
              ? above
              : Math.min(pointY + GAP, VIEW_HEIGHT - height);

          return { label, width, height, x, y };
        })()
      : null;

  let axisRows: { value: number; accent: boolean }[];
  if (hasRecommended) {
    // 위/아래 칸이 휑해 보이지 않게, max~권장상단 사이와 권장하단~min 사이에도
    // 중간값을 계산해서 보조 점선을 하나씩 더 넣어요.
    const midUpper = (max + recommendedMax) / 2;
    const midLower = (recommendedMin + min) / 2;

    axisRows = [
      { value: max, accent: false },
      ...(midUpper > recommendedMax
        ? [{ value: midUpper, accent: false }]
        : []),
      { value: recommendedMax, accent: true },
      { value: recommendedMin, accent: true },
      ...(midLower < recommendedMin
        ? [{ value: midLower, accent: false }]
        : []),
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
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
    >
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
      {visiblePoints.length > 0 ? (
        <>
          {pointSegments.map((segment, segmentIndex) => (
            <Polyline
              key={`segment-${segmentIndex}`}
              points={segment.map(([x, y]) => `${x},${y}`).join(" ")}
              stroke={color}
              strokeWidth={2}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          {visiblePoints.map(([x, y], index) => (
            <Circle key={index} cx={x} cy={y} r={4} fill={color} />
          ))}
          {finalBadge ? (
            <>
              <Rect
                x={finalBadge.x}
                y={finalBadge.y}
                width={finalBadge.width}
                height={finalBadge.height}
                rx={3}
                fill={color}
              />
              <SvgText
                x={finalBadge.x + finalBadge.width / 2}
                y={finalBadge.y + finalBadge.height / 2 + 5}
                fontSize={15}
                fontWeight="600"
                fill="#FFFFFF"
                textAnchor="middle"
              >
                {finalBadge.label}
              </SvgText>
            </>
          ) : null}
        </>
      ) : null}
    </Svg>
  );
}
