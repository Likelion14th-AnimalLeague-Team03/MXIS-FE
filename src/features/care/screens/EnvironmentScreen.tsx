import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  EnvironmentMetricToggle,
  EnvironmentRangeTabs,
} from "@/features/care/components/EnvironmentControls";
import { EnvironmentStats } from "@/features/care/components/EnvironmentStats";
import { HumidityLineChart } from "@/features/care/components/HumidityLineChart";
import { useCareEnvironmentOverview } from "@/features/care/hooks/useCare";
import {
  createEnvironmentPresentation,
  type EnvironmentMetric,
  type EnvironmentRange,
} from "@/features/care/utils/environmentPresentation";
import { usePrimaryProductId } from "@/features/product/hooks/useProduct";
import { Card } from "@/shared/components/Card";
import { WarningIcon } from "@/shared/components/icons/WarningIcon";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { SentenceList } from "@/shared/components/SentenceList";

export function EnvironmentScreen() {
  const router = useRouter();
  const [range, setRange] = useState<EnvironmentRange>("최근 30일");
  const [metric, setMetric] = useState<EnvironmentMetric>("HUMIDITY");
  const { productId } = usePrimaryProductId();
  const {
    data: overview,
    isPending,
    error,
  } = useCareEnvironmentOverview(productId);
  const presentation = createEnvironmentPresentation(overview, range, metric);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView className="flex-1 px-6" contentContainerClassName="pb-8">
        <View className="mt-6">
          <ScreenHeader title="환경 데이터" onBack={() => router.back()} />
        </View>

        <EnvironmentRangeTabs range={range} onSelect={setRange} />

        <Card className="mt-4 border-0 bg-white px-4 py-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-concierge-text">
              {presentation.isHumidity ? "습도 변화" : "온도 변화"}
            </Text>
            <EnvironmentMetricToggle metric={metric} onSelect={setMetric} />
          </View>
          <View className="mt-4">
            <HumidityLineChart
              width={306}
              values={presentation.values}
              min={presentation.chartMin}
              max={presentation.chartMax}
              recommendedMin={
                presentation.hasData ? presentation.recommended.min : undefined
              }
              recommendedMax={
                presentation.hasData ? presentation.recommended.max : undefined
              }
              unit={presentation.unit}
            />
            {!presentation.hasData ? (
              <View className="absolute inset-0 items-center justify-center">
                <Text className="text-xs font-medium text-concierge-textMuted">
                  {isPending ? "불러오는 중" : "데이터 수집중"}
                </Text>
              </View>
            ) : null}
          </View>
          <Text className="mt-4 text-sm text-concierge-textMuted">
            {presentation.hasData
              ? "권장 범위 안에서 비교적 안정적으로 유지되었습니다."
              : "충분한 데이터가 모이지 않았습니다."}
          </Text>
          {error ? (
            <Text className="mt-2 text-xs text-[#C04737]">{error.message}</Text>
          ) : null}
        </Card>

        {presentation.hasData && range === "최근 1년" ? (
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

        <EnvironmentStats period={presentation.period} />

        <Card className="mt-4 gap-2 border-0 bg-concierge-surfaceMuted px-4 py-4">
          <Text className="text-lg font-bold text-concierge-text">
            데이터 해석
          </Text>
          <SentenceList
            text={presentation.period?.interpretation}
            fallback="현재 데이터를 수집하고 있습니다. 충분한 기록이 쌓이면 제품의 사용 환경과 패턴을 종합해 안내해 드립니다."
            textClassName="text-[15px] font-medium text-[#222222]"
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
