import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "@/shared/components/Card";
import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";
import { DropletIcon } from "@/shared/components/icons/DropletIcon";
import { FootprintIcon } from "@/shared/components/icons/FootprintIcon";
import { ShieldCheckIcon } from "@/shared/components/icons/ShieldIcon";
import { ThermometerIcon } from "@/shared/components/icons/ThermometerIcon";
import { WindIcon } from "@/shared/components/icons/WindIcon";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { SecondaryButton } from "@/shared/components/SecondaryButton";

function SummaryRow({
  icon,
  label,
  caption,
  value,
  divider = true
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

export function ReportScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView className="flex-1 px-6" contentContainerClassName="pb-8">
        <View className="mt-3 flex-row items-center">
          <ScreenHeader title="상태 리포트" onBack={() => router.back()} className="flex-1" />
          <View className="rounded-full border border-concierge-primary px-2 py-1">
            <Text className="text-xs text-concierge-primary">Aren Shopper</Text>
          </View>
        </View>

        <Card className="mt-4 border-0 bg-white px-4 py-3.5">
          <Text className="text-xs text-concierge-textMuted">현재 컨디션</Text>
          <Text className="mt-1 text-lg font-bold text-concierge-text">안정적인 상태입니다.</Text>
          <Text className="mt-1 text-[13px] text-concierge-textMuted">
            제품을 손상으로 단정하지 않고 최근 환경과 사용 기록을 바탕으로 관리 필요 가능성을
            안내합니다.
          </Text>
        </Card>

        <Text className="mt-5 text-xl font-bold text-concierge-text">최근 환경 요약</Text>
        <Card className="mt-3 bg-white px-3">
          <SummaryRow
            icon={<DropletIcon size={18} />}
            label="평균 습도"
            caption="권장 범위 안"
            value="42%"
          />
          <SummaryRow
            icon={<ThermometerIcon size={18} />}
            label="평균 온도"
            caption="큰 변화 없음"
            value="22°C"
          />
          <SummaryRow
            icon={<WindIcon size={18} />}
            label="건조 환경 노출"
            caption="최근 7일"
            value="짧음"
          />
          <SummaryRow
            icon={<FootprintIcon size={18} />}
            label="최근 사용 패턴"
            caption="최근 7일"
            value="많음"
            divider={false}
          />
        </Card>

        <Card className="mt-4 flex-row items-center gap-3 bg-white px-4 py-3">
          <View className="size-[58px] items-center justify-center rounded-full bg-concierge-accent">
            <ShieldCheckIcon size={26} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-concierge-text">제품 상태 해석</Text>
            <Text className="mt-1 text-[13px] text-concierge-textMuted">
              현재는 안정적으로 유지되고 있으나, 다음 계절 전 가벼운 점검을 권장합니다.
            </Text>
          </View>
        </Card>

        <Card className="mt-4 border-0 bg-concierge-surfaceMuted px-4 py-3">
          <Text className="text-xs text-concierge-textMuted">이번 계절이 지나기 전</Text>
          <Text className="mt-1 text-[15px] font-bold text-concierge-text">
            가벼운 컨디션 점검을 제안드려요.
          </Text>
          <Text className="mt-1 text-xs text-concierge-textMuted">
            누적 사용 기록을 바탕으로 예방 케어 시점을 안내합니다.
          </Text>
          <Pressable className="mt-2 flex-row items-center justify-between">
            <Text className="text-sm text-concierge-text">케어 제안 확인</Text>
            <ChevronRightIcon size={5} />
          </Pressable>
        </Card>

        <View className="mt-6 flex-row gap-3">
          <SecondaryButton
            label="환경 데이터"
            onPress={() => router.push("/care/environment")}
            className="flex-1"
          />
          <SecondaryButton label="관리 가이드" onPress={() => {}} className="flex-1" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
