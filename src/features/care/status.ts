/**
 * 케어 진단 상태 등급 판정.
 *
 * 온·습도 기준은 기획에서 받은 표를 그대로 옮겼습니다.
 *
 * 온도(°C)
 *   18~22  안전   가죽 보관에 적합
 *   15~17  주의   다소 낮음, 장기간 노출 주의
 *   23~25  주의   다소 높음, 건조·열화 가능성 증가
 *   < 15   위험   지나치게 낮은 온도 및 환경 변화 주의
 *   > 25   위험   열에 의한 건조·노화 촉진 가능
 *
 * 상대습도(%)
 *   45~55  안전   가죽 보관 최적 범위
 *   30~44  주의   건조해지면서 유연성 저하 가능
 *   56~65  주의   습도가 높아져 곰팡이 위험 증가
 *   < 30   위험   수분 손실 → 딱딱해짐·갈라짐 위험
 *   > 65   위험   곰팡이 발생에 유리한 환경
 *
 * 기준표가 정수 구간이라, 화면에 표시하는 값과 등급이 항상 일치하도록
 * 판정 전에 값을 먼저 반올림합니다. (예: 22.5 → 23°C 표시 + 주의)
 */

export type CareLevel = "PENDING" | "SAFE" | "CAUTION" | "DANGER";

export const TEMPERATURE_RANGE = {
  safeMin: 18,
  safeMax: 22,
  cautionMin: 15,
  cautionMax: 25,
} as const;

export const HUMIDITY_RANGE = {
  safeMin: 45,
  safeMax: 55,
  cautionMin: 30,
  cautionMax: 65,
} as const;

type LevelRange = {
  safeMin: number;
  safeMax: number;
  cautionMin: number;
  cautionMax: number;
};

function resolveLevel(value: number | null | undefined, range: LevelRange) {
  if (value == null || Number.isNaN(value)) return "PENDING" as const;

  const rounded = Math.round(value);

  if (rounded < range.cautionMin || rounded > range.cautionMax) {
    return "DANGER" as const;
  }

  if (rounded >= range.safeMin && rounded <= range.safeMax) {
    return "SAFE" as const;
  }

  return "CAUTION" as const;
}

export function resolveTemperatureLevel(
  celsius: number | null | undefined,
): CareLevel {
  return resolveLevel(celsius, TEMPERATURE_RANGE);
}

export function resolveHumidityLevel(
  percent: number | null | undefined,
): CareLevel {
  return resolveLevel(percent, HUMIDITY_RANGE);
}

const LEVEL_SEVERITY: Record<CareLevel, number> = {
  PENDING: 0,
  SAFE: 1,
  CAUTION: 2,
  DANGER: 3,
};

/** 온·습도 중 더 나쁜 등급을 전체 컨디션 등급으로 씁니다. */
export function resolveWorstLevel(...levels: CareLevel[]): CareLevel {
  return levels.reduce<CareLevel>(
    (worst, level) =>
      LEVEL_SEVERITY[level] > LEVEL_SEVERITY[worst] ? level : worst,
    "PENDING",
  );
}

/**
 * 컨디션 등급 판정.
 *
 * 서버 응답에 등급 필드가 아직 없어서, 요약 문구의 키워드를 우선 사용하고
 * 키워드가 없으면 온·습도 등급 중 더 나쁜 쪽으로 판정합니다.
 */
export function resolveConditionLevel({
  summary,
  temperatureLevel,
  humidityLevel,
}: {
  summary?: string | null;
  temperatureLevel: CareLevel;
  humidityLevel: CareLevel;
}): CareLevel {
  if (summary) {
    if (summary.includes("위험")) return "DANGER";
    if (summary.includes("주의")) return "CAUTION";
    if (summary.includes("안정") || summary.includes("안전")) return "SAFE";
  }

  return resolveWorstLevel(temperatureLevel, humidityLevel);
}
