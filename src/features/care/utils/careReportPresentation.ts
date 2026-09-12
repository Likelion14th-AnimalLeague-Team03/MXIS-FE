import {
  type CareConditionGrade,
  resolveConditionLevel,
  resolveHumidityLevel,
  resolveTemperatureLevel,
} from "@/features/care/status";
import type { CareReportScreen } from "@/features/care/types";
import { parseLocalDate } from "@/shared/api/localTime";
import { formatDateDot } from "@/shared/utils/dateFormat";

const MISSING_VALUE = "ㅡ";

export function createCareReportPresentation(
  report: CareReportScreen | undefined,
  isPending: boolean,
  /** 서버가 판정한 등급 — 있으면 온·습도 기반 자체 판정보다 우선합니다. */
  conditionGrade?: CareConditionGrade | null,
) {
  const environment = report?.environment30d;
  const temperatureLevel = resolveTemperatureLevel(environment?.avgTemperature);
  const humidityLevel = resolveHumidityLevel(environment?.avgHumidity);
  const conditionLevel = resolveConditionLevel({
    grade: conditionGrade,
    summary: report?.condition?.summary,
    temperatureLevel,
    humidityLevel,
  });
  const hasTemperature = environment?.avgTemperature != null;
  const hasHumidity = environment?.avgHumidity != null;
  // 케어 필요 여부도 서버 판단(careNeeded)을 먼저 믿고, 없을 때만 등급으로 추론해요.
  const needsCare =
    report?.careNeeded ??
    (conditionLevel === "CAUTION" || conditionLevel === "DANGER");

  return {
    conditionDetail:
      report?.condition?.detail?.trim() ||
      "아직 충분한 데이터가 쌓이지 않았습니다. 데이터를 수집 할수록 진단이 더 정확해져요.",
    conditionLevel,
    conditionSummary:
      report?.condition?.summary?.trim() ||
      (isPending ? "불러오는 중" : "리포트 준비중"),
    environment,
    hasHumidity,
    hasTemperature,
    humidityLevel,
    humidityValue: hasHumidity
      ? `${Math.round(Number(environment?.avgHumidity))}%`
      : MISSING_VALUE,
    interpretation:
      report?.interpretation?.trim() ||
      "아직 제품 상태를 해석할 만큼 데이터가 충분하지 않아요. 며칠 더 데이터를 모으면 맞춤 리포트를 확인할 수 있어요.",
    needsCare,
    nextCareLabel: report?.nextCareRecommendedAt
      ? `${formatDateDot(parseLocalDate(report.nextCareRecommendedAt))} 이전`
      : report?.careCycleMonths != null
        ? `권장 케어 주기 ${report.careCycleMonths}개월`
        : null,
    temperatureLevel,
    temperatureValue: hasTemperature
      ? `${Math.round(Number(environment?.avgTemperature))}°C`
      : MISSING_VALUE,
  };
}

export { MISSING_VALUE };
