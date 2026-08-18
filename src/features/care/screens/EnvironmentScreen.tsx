import { useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import outIcon from "@/features/care/assets/out.png";
import popIcon from "@/features/care/assets/pop.png";
import temperatureIcon from "@/features/care/assets/temperature.png";
import waterIcon from "@/features/care/assets/water.png";
import { HumidityLineChart } from "@/features/care/components/HumidityLineChart";
import { useCareEnvironmentOverview } from "@/features/care/hooks/useCare";
import type { CareEnvironmentOverview } from "@/features/care/types";
import { usePrimaryProductId } from "@/features/product/hooks/useProduct";
import { Card } from "@/shared/components/Card";
import { WarningIcon } from "@/shared/components/icons/WarningIcon";
import { ScreenHeader } from "@/shared/components/ScreenHeader";

const RANGES = ["최근 7일", "최근 30일", "최근 1년"] as const;
type Range = (typeof RANGES)[number];

// 화면 탭 <-> CareEnvironmentOverviewResponse 필드 매핑
const OVERVIEW_FIELD_BY_RANGE: Record<Range, keyof CareEnvironmentOverview> = {
  "최근 7일": "sevenDays",
  "최근 30일": "thirtyDays",
  "최근 1년": "oneYear",
};

type Metric = "HUMIDITY" | "TEMP";

function MetricToggle({
  metric,
  onSelect,
}: {
  metric: Metric;
  onSelect: (metric: Metric) => void;
}) {
  return (
    <View className="flex-row rounded-lg bg-concierge-surfaceMuted p-0.5">
      {(["TEMP", "HUMIDITY"] as Metric[]).map((option) => {
        const selected = metric === option;
        return (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            className={`rounded-md px-2.5 py-1 ${selected ? "bg-white" : ""}`}
          >
            <Text
              className={`text-xs ${selected ? "font-semibold text-concierge-text" : "text-concierge-textMuted"}`}
            >
              {option === "TEMP" ? "온도" : "습도"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function StatTile({
  icon,
  label,
  value,
  muted = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <View className="w-[47%] flex-row items-center gap-3 rounded-2xl border border-concierge-borderLight bg-white px-4 py-4">
      <View>
        <Text className="text-xs text-concierge-textMuted">{label}</Text>
        <Text
          className={
            muted
              ? "mt-2 text-sm font-semibold text-concierge-textMuted"
              : "mt-2 text-lg font-bold text-concierge-text"
          }
        >
          {value}
        </Text>
      </View>
      <View className="ml-auto size-10 items-center justify-center rounded-full bg-concierge-surfaceMuted">
        {icon}
      </View>
    </View>
  );
}

// 권장 범위 — 습도 45~55%, 온도 18~20°C. 그래프에 연두색 밴드로 강조돼요.
const HUMIDITY_RECOMMENDED = { min: 45, max: 55 };
const TEMPERATURE_RECOMMENDED = { min: 18, max: 20 };

// 데이터 수집중일 땐 권장 범위와 무관하게 이 기본 축 범위로 기본 그래프만 그려요.
const HUMIDITY_BASIC_RANGE = { min: 25, max: 70 };
const TEMPERATURE_BASIC_RANGE = { min: 10, max: 30 };

export function EnvironmentScreen() {
  const router = useRouter();
  const [range, setRange] = useState<Range>("최근 30일");
  const [metric, setMetric] = useState<Metric>("HUMIDITY");
  const { productId } = usePrimaryProductId();
  const { data: overview, isPending, error } = useCareEnvironmentOverview(productId);

  const period = overview?.[OVERVIEW_FIELD_BY_RANGE[range]] ?? null;
  const isHumidity = metric === "HUMIDITY";
  const values = (
    isHumidity ? (period?.humidityPoints ?? []) : (period?.temperaturePoints ?? [])
  ).map((point) => point.value);
  const hasData = values.length > 0;
  const recommended = isHumidity ? HUMIDITY_RECOMMENDED : TEMPERATURE_RECOMMENDED;
  const basicRange = isHumidity ? HUMIDITY_BASIC_RANGE : TEMPERATURE_BASIC_RANGE;
  const unit = isHumidity ? "%" : "°C";

  // y축 최소/최대는 고정값이 아니라 백엔드가 넘겨주는 데이터의 최소값-5 ~ 최대값+5로 계산해요.
  // 데이터 수집중일 땐 계산할 데이터가 없으니 기본 범위를 써요.
  const chartMin = hasData ? Math.min(...values) - 5 : basicRange.min;
  const chartMax = hasData ? Math.max(...values) + 5 : basicRange.max;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView className="flex-1 px-6" contentContainerClassName="pb-8">
        <View className="mt-6">
          <ScreenHeader title="환경 데이터" onBack={() => router.back()} />
        </View>

        <View className="mt-4 flex-row rounded-xl bg-white p-1">
          {RANGES.map((label) => {
            const selected = range === label;
            return (
              <Pressable
                key={label}
                onPress={() => setRange(label)}
                className={`flex-1 items-center rounded-lg py-2.5 ${
                  selected ? "bg-concierge-primary" : ""
                }`}
              >
                <Text
                  className={`text-sm ${selected ? "text-white" : "text-concierge-textMuted"}`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Card className="mt-4 border-0 bg-white px-4 py-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-concierge-text">
              {isHumidity ? "습도 변화" : "온도 변화"}
            </Text>
            <MetricToggle metric={metric} onSelect={setMetric} />
          </View>
          <View className="mt-4">
            <HumidityLineChart
              width={306}
              values={values}
              min={chartMin}
              max={chartMax}
              recommendedMin={hasData ? recommended.min : undefined}
              recommendedMax={hasData ? recommended.max : undefined}
              unit={unit}
            />
            {!hasData ? (
              <View className="absolute inset-0 items-center justify-center">
                <Text className="text-xs font-medium text-concierge-textMuted">
                  {isPending ? "불러오는 중" : "데이터 수집중"}
                </Text>
              </View>
            ) : null}
          </View>
          <Text className="mt-4 text-sm text-concierge-textMuted">
            {hasData
              ? "권장 범위 안에서 비교적 안정적으로 유지되었습니다."
              : "충분한 데이터가 모이지 않았습니다."}
          </Text>
          {error ? (
            <Text className="mt-2 text-xs text-[#C04737]">{error.message}</Text>
          ) : null}
        </Card>

        {hasData && range === "최근 1년" ? (
          <View className="mt-3 rounded-xl border border-concierge-border bg-white px-3 py-2.5">
            <View className="flex-row items-center gap-1.5">
              <WarningIcon size={12} />
              <Text className="text-xs font-semibold text-concierge-text">
                평균치 안내
              </Text>
            </View>
            <Text className="mt-1 text-xs text-concierge-textMuted">
              충격횟수, 외출횟수 평균 1년 탭에서는 7일, 30일과 다르게 평균치임을
              알려드립니다.
            </Text>
          </View>
        ) : null}

        <View className="mt-4 flex-row flex-wrap justify-between gap-y-3">
          <StatTile
            icon={
              <Image
                source={temperatureIcon}
                className="size-[18px]"
                resizeMode="contain"
              />
            }
            label="평균 온도"
            value={
              period?.avgTemperature != null
                ? `${Math.round(period.avgTemperature)}°C`
                : "수집중"
            }
            muted={period?.avgTemperature == null}
          />
          <StatTile
            icon={
              <Image
                source={waterIcon}
                className="size-[18px]"
                resizeMode="contain"
              />
            }
            label="평균 습도"
            value={
              period?.avgHumidity != null
                ? `${Math.round(period.avgHumidity)}%`
                : "수집중"
            }
            muted={period?.avgHumidity == null}
          />
          <StatTile
            icon={
              <Image source={outIcon} className="size-[18px]" resizeMode="contain" />
            }
            label="외출"
            value={period?.outingCount != null ? `${period.outingCount}회` : "수집중"}
            muted={period?.outingCount == null}
          />
          <StatTile
            icon={
              <Image source={popIcon} className="size-[18px]" resizeMode="contain" />
            }
            label="충격"
            value={period?.shockCount != null ? `${period.shockCount}회` : "수집중"}
            muted={period?.shockCount == null}
          />
        </View>

        <Card className="mt-4 gap-2 border-0 bg-concierge-surfaceMuted px-4 py-4">
          <Text className="text-lg font-bold text-concierge-text">
            데이터 해석
          </Text>
          <Text className="text-[15px] font-medium text-[#222222]">
            {period?.interpretation ??
              "현재 데이터를 수집하고 있습니다.\n\n충분한 기록이 쌓이면 제품의 사용 환경과 패턴을 종합해 안내해 드립니다."}
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
