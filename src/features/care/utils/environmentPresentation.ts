import type {
  CareEnvironmentOverview,
  PeriodEnvironment,
} from "@/features/care/types";

export const ENVIRONMENT_RANGES = ["최근 7일", "최근 30일", "최근 1년"] as const;

export type EnvironmentRange = (typeof ENVIRONMENT_RANGES)[number];
export type EnvironmentMetric = "HUMIDITY" | "TEMP";

const OVERVIEW_FIELD_BY_RANGE: Record<
  EnvironmentRange,
  keyof CareEnvironmentOverview
> = {
  "최근 7일": "sevenDays",
  "최근 30일": "thirtyDays",
  "최근 1년": "oneYear",
};

const RECOMMENDED_RANGE: Record<
  EnvironmentMetric,
  { min: number; max: number }
> = {
  HUMIDITY: { min: 45, max: 55 },
  TEMP: { min: 18, max: 20 },
};

const EMPTY_CHART_RANGE: Record<
  EnvironmentMetric,
  { min: number; max: number }
> = {
  HUMIDITY: { min: 0, max: 70 },
  TEMP: { min: 10, max: 30 },
};

export function createEnvironmentPresentation(
  overview: CareEnvironmentOverview | undefined,
  range: EnvironmentRange,
  metric: EnvironmentMetric,
) {
  const period: PeriodEnvironment | null =
    overview?.[OVERVIEW_FIELD_BY_RANGE[range]] ?? null;
  const isHumidity = metric === "HUMIDITY";
  const values = (
    isHumidity
      ? (period?.humidityPoints ?? [])
      : (period?.temperaturePoints ?? [])
  ).map((point) => point.value);
  const numericValues = values.filter(
    (value): value is number => typeof value === "number",
  );
  const hasData = numericValues.length > 0;
  const recommended = RECOMMENDED_RANGE[metric];
  const emptyRange = EMPTY_CHART_RANGE[metric];

  return {
    chartMax: hasData ? Math.max(...numericValues) + 5 : emptyRange.max,
    chartMin: hasData
      ? isHumidity
        ? 0
        : Math.min(...numericValues) - 5
      : emptyRange.min,
    hasData,
    isHumidity,
    period,
    recommended,
    unit: isHumidity ? "%" : "°C",
    values,
  };
}
