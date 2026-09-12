import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ConditionCard,
  MetricStatusBar,
} from "@/features/care/components/CareConditionOverview";
import { CareRecommendationCard } from "@/features/care/components/CareRecommendationCard";
import { CareReportDetails } from "@/features/care/components/CareReportDetails";
import { useCareReport } from "@/features/care/hooks/useCare";
import { createCareReportPresentation } from "@/features/care/utils/careReportPresentation";
import { usePrimaryProductId } from "@/features/product/hooks/useProduct";
import { useReservationStore } from "@/features/reservation/store";
import type { ReservationType } from "@/features/reservation/types";
import { ScreenHeader } from "@/shared/components/ScreenHeader";

export function ReportScreen() {
  const router = useRouter();
  const { productId } = usePrimaryProductId();
  const { data: report, isPending, error } = useCareReport(productId);
  const setPendingCareType = useReservationStore(
    (state) => state.setPendingCareType,
  );
  const resetDraft = useReservationStore((state) => state.resetDraft);
  const presentation = createCareReportPresentation(report, isPending);

  const goToCareInput = (careType: ReservationType) => {
    setPendingCareType(careType);
    resetDraft();
    router.push("/reservation/input");
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView className="flex-1 px-6" contentContainerClassName="pb-8">
        <View className="mt-6">
          <ScreenHeader title="상태 리포트" onBack={() => router.back()} />
        </View>

        <MetricStatusBar
          temperatureLevel={presentation.temperatureLevel}
          humidityLevel={presentation.humidityLevel}
        />
        <ConditionCard
          level={presentation.conditionLevel}
          summary={presentation.conditionSummary}
          detail={presentation.conditionDetail}
        />

        {error ? (
          <Text className="mt-2 text-xs text-[#C04737]">{error.message}</Text>
        ) : null}

        <CareRecommendationCard
          noticeLabel={presentation.needsCare ? presentation.nextCareLabel : null}
          title={
            presentation.needsCare
              ? "가벼운 컨디션 점검을 제안드려요."
              : "현재는 별도의 방문 케어가 필요하지 않아요."
          }
          onPressReserve={() =>
            goToCareInput(presentation.needsCare ? "FREE" : "PAID")
          }
        />

        <CareReportDetails
          environment={presentation.environment}
          hasHumidity={presentation.hasHumidity}
          hasTemperature={presentation.hasTemperature}
          humidityValue={presentation.humidityValue}
          interpretation={presentation.interpretation}
          onOpenEnvironment={() => router.push("/care/environment")}
          onOpenGuide={() => router.push("/care/guide")}
          temperatureValue={presentation.temperatureValue}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
