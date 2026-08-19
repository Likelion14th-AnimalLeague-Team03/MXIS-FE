import { useRouter } from "expo-router";
import { type ReactNode } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import outIcon from "@/features/care/assets/out.png";
import popIcon from "@/features/care/assets/pop.png";
import temperatureIcon from "@/features/care/assets/temperature.png";
import waterIcon from "@/features/care/assets/water.png";
import { useCareReport } from "@/features/care/hooks/useCare";
import { usePrimaryProductId } from "@/features/product/hooks/useProduct";
import { formatDateDot } from "@/features/reservation/format";
import { parseLocalDate } from "@/shared/api/localTime";
import { Card } from "@/shared/components/Card";
import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";
import { ShieldCheckIcon } from "@/shared/components/icons/ShieldIcon";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { SecondaryButton } from "@/shared/components/SecondaryButton";
import { SentenceList } from "@/shared/components/SentenceList";

function SummaryRow({
  icon,
  label,
  caption,
  value,
  divider = true,
}: {
  icon: ReactNode;
  label: string;
  caption: string;
  value: string;
  divider?: boolean;
}) {
  return (
    <>
      <View className="flex-row items-center gap-2 py-2.5">
        {icon}
        <View className="flex-1">
          <Text className="text-sm text-concierge-text">{label}</Text>
          <Text className="text-xs text-concierge-textMuted">{caption}</Text>
        </View>
        <Text className="text-sm font-bold text-concierge-text">{value}</Text>
      </View>
      {divider ? (
        <View className="border-t border-concierge-borderLight" />
      ) : null}
    </>
  );
}

export function ReportScreen() {
  const router = useRouter();
  const { productId } = usePrimaryProductId();
  const { data: report, isPending, error } = useCareReport(productId);

  const environment = report?.environment30d;
  const careNeeded = report?.careNeeded ?? false;
  const nextCareLabel = report?.nextCareRecommendedAt
    ? `${formatDateDot(parseLocalDate(report.nextCareRecommendedAt))} 이전`
    : report?.careCycleMonths != null
      ? `권장 케어 주기 ${report.careCycleMonths}개월`
      : null;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView className="flex-1 px-6" contentContainerClassName="pb-8">
        <View className="mt-6">
          <ScreenHeader title="상태 리포트" onBack={() => router.back()} />
        </View>

        <Card className="mt-4 border-0 bg-white px-4 py-3.5">
          <Text className="text-xs text-concierge-textMuted">현재 컨디션</Text>
          <Text className="mt-1 text-lg font-bold text-concierge-text">
            {report?.condition?.summary ?? (isPending ? "불러오는 중" : "리포트 준비 중")}
          </Text>
          <SentenceList
            className="mt-1"
            text={report?.condition?.detail}
            fallback="아직 충분한 데이터가 쌓이지 않았습니다. 데이터를 수집 할수록 진단이 더 정확해져요"
          />
          {error ? (
            <Text className="mt-2 text-xs text-[#C04737]">{error.message}</Text>
          ) : null}
        </Card>

        <Text className="mt-5 text-xl font-bold text-concierge-text">
          최근 환경 요약
        </Text>
        <Card className="mt-3 bg-white px-3">
          <SummaryRow
            icon={
              <Image
                source={temperatureIcon}
                className="size-[18px]"
                resizeMode="contain"
              />
            }
            label="평균 온도"
            caption={environment?.temperatureDescription ?? "데이터 수집 중"}
            value={
              environment?.avgTemperature != null
                ? `${Math.round(environment.avgTemperature)}°C`
                : "—"
            }
          />
          <SummaryRow
            icon={
              <Image
                source={waterIcon}
                className="size-[18px]"
                resizeMode="contain"
              />
            }
            label="평균 습도"
            caption={environment?.humidityDescription ?? "데이터 수집 중"}
            value={
              environment?.avgHumidity != null
                ? `${Math.round(environment.avgHumidity)}%`
                : "—"
            }
          />
          <SummaryRow
            icon={
              <Image
                source={popIcon}
                className="size-[18px]"
                resizeMode="contain"
              />
            }
            label="충격"
            caption={environment?.shockLevelLabel ? "최근 30일" : "분석 전"}
            value={environment?.shockLevelLabel ?? "—"}
          />
          <SummaryRow
            icon={
              <Image
                source={outIcon}
                className="size-[18px]"
                resizeMode="contain"
              />
            }
            label="최근 사용 패턴"
            caption={environment?.outingCount != null ? "최근 30일 외출" : "분석 전"}
            value={
              environment?.outingCount != null ? `${environment.outingCount}회` : "—"
            }
            divider={false}
          />
        </Card>

        <Card className="mt-4 flex-row items-center gap-3 bg-white px-4 py-3">
          <View className="size-[58px] items-center  justify-center rounded-full bg-concierge-accent/30">
            <ShieldCheckIcon size={30} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-concierge-text">
              제품 상태 해석
            </Text>
            <SentenceList
              className="mt-1"
              text={report?.interpretation}
              fallback="아직 제품 상태를 해석할 만큼 데이터가 충분하지 않아요. 며칠 더 데이터를 모으면 맞춤 리포트를 확인할 수 있어요."
            />
          </View>
        </Card>

        <Card className="mt-4 border-0 bg-concierge-surfaceMuted px-4 py-3">
          {careNeeded && nextCareLabel ? (
            <Text className="text-xs text-concierge-textMuted">{nextCareLabel}</Text>
          ) : null}
          <Text className="mt-1 text-[15px] font-bold text-concierge-text">
            {careNeeded
              ? "가벼운 컨디션 점검을 제안드려요."
              : "현재는 별도의 방문 케어가 필요하지 않아요."}
          </Text>
          <Text className="mt-1 text-xs text-concierge-textMuted">
            누적 사용 기록을 바탕으로 예방 케어 시점을 안내합니다.
          </Text>
          <Pressable
            onPress={() => router.push("/reservation/input")}
            className="mt-2 flex-row items-center justify-between"
          >
            <Text className="text-sm text-concierge-text">
              케어 예약 바로가기
            </Text>
            <ChevronRightIcon size={5} />
          </Pressable>
        </Card>

        <View className="mt-6 flex-row gap-3">
          <SecondaryButton
            label="환경 데이터"
            onPress={() => router.push("/care/environment")}
            className="flex-1"
          />
          <SecondaryButton
            label="관리 가이드"
            onPress={() => router.push("/care/guide")}
            className="flex-1"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
