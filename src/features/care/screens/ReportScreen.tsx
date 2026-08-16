import { useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import outIcon from "@/features/care/assets/out.png";
import popIcon from "@/features/care/assets/pop.png";
import temperatureIcon from "@/features/care/assets/temperature.png";
import waterIcon from "@/features/care/assets/water.png";
import { Card } from "@/shared/components/Card";
import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";
import { ShieldCheckIcon } from "@/shared/components/icons/ShieldIcon";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { SecondaryButton } from "@/shared/components/SecondaryButton";

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
      {divider ? <View className="border-t border-concierge-borderLight" /> : null}
    </>
  );
}

// 진단 API가 붙기 전까지, 데이터 수집중 상태의 디자인도 테스트해볼 수 있는 토글이에요.
function DataTestToggle({
  hasData,
  onToggle,
}: {
  hasData: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <View className="mt-4 flex-row items-center gap-2 rounded-xl border border-dashed border-concierge-border bg-white px-3 py-2.5">
      <Text className="text-xs font-semibold text-concierge-textMuted">테스트</Text>
      <View className="flex-1 flex-row justify-end gap-1.5">
        {[
          { key: true, label: "데이터 있음" },
          { key: false, label: "수집중" },
        ].map((option) => (
          <Pressable
            key={String(option.key)}
            onPress={() => onToggle(option.key)}
            className={`rounded-full px-2.5 py-1 ${
              hasData === option.key ? "bg-concierge-primary" : "bg-concierge-chip"
            }`}
          >
            <Text
              className={`text-xs ${
                hasData === option.key ? "text-white" : "text-concierge-textSecondary"
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function ReportScreen() {
  const router = useRouter();
  const [hasData, setHasData] = useState(true);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView className="flex-1 px-6" contentContainerClassName="pb-8">
        <View className="mt-3">
          <ScreenHeader title="상태 리포트" onBack={() => router.back()} />
        </View>

        <DataTestToggle hasData={hasData} onToggle={setHasData} />

        <Card className="mt-4 border-0 bg-white px-4 py-3.5">
          <Text className="text-xs text-concierge-textMuted">현재 컨디션</Text>
          <Text className="mt-1 text-lg font-bold text-concierge-text">
            {hasData ? "안정적인 상태입니다." : "리포트 준비 중"}
          </Text>
          <Text className="mt-1 text-[13px] text-concierge-textMuted">
            {hasData
              ? "제품을 손상으로 단정하지 않고 최근 환경과 사용 기록을 바탕으로 관리 필요 가능성을 안내합니다."
              : "아직 충분한 데이터가 쌓이지 않았습니다. 데이터를 수집 할수록 진단이 더 정확해져요"}
          </Text>
        </Card>

        <Text className="mt-5 text-xl font-bold text-concierge-text">최근 환경 요약</Text>
        <Card className="mt-3 bg-white px-3">
          <SummaryRow
            icon={<Image source={temperatureIcon} className="size-[18px]" resizeMode="contain" />}
            label="평균 온도"
            caption="데이터 수집 중"
            value="22°C"
          />
          <SummaryRow
            icon={<Image source={waterIcon} className="size-[18px]" resizeMode="contain" />}
            label="평균 습도"
            caption="데이터 수집 중"
            value="42%"
          />
          <SummaryRow
            icon={<Image source={popIcon} className="size-[18px]" resizeMode="contain" />}
            label="충격"
            caption="분석 전"
            value="낮음"
          />
          <SummaryRow
            icon={<Image source={outIcon} className="size-[18px]" resizeMode="contain" />}
            label="최근 사용 패턴"
            caption="분석 전"
            value="18회"
            divider={false}
          />
        </Card>

        <Card className="mt-4 flex-row items-center gap-3 bg-white px-4 py-3">
          <View className="size-[58px] items-center justify-center rounded-full bg-concierge-surfaceMuted">
            <ShieldCheckIcon size={26} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-concierge-text">제품 상태 해석</Text>
            <Text className="mt-1 text-[13px] text-concierge-textMuted">
              {hasData
                ? "현재는 안정적으로 유지되고 있으나, 다음 계절 전 가벼운 점검을 권장합니다."
                : "아직 제품 상태를 해석할 만큼 데이터가 충분하지 않아요. 며칠 더 데이터를 모으면 맞춤 리포트를 확인할 수 있어요."}
            </Text>
          </View>
        </Card>

        <Card className="mt-4 border-0 bg-concierge-surfaceMuted px-4 py-3">
          {hasData ? (
            <Text className="text-xs text-concierge-textMuted">이번 계절이 지나기 전</Text>
          ) : null}
          <Text className="mt-1 text-[15px] font-bold text-concierge-text">
            {hasData
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
            <Text className="text-sm text-concierge-text">케어 예약 바로가기</Text>
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
