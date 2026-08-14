import { useRouter } from "expo-router";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";

import guideBg from "@/features/care/assets/guide-bg.png";
import { Card } from "@/shared/components/Card";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { colors } from "@/shared/styles/colors";

const CARE_STEPS = [
  "마른 부드러운 천을 준비해주세요.",
  "결 방향을 따라 부드럽게 닦아주세요.",
  "강한 힘을 주지 않고 가볍게 닦아주세요."
];

function CheckSquareIcon({
  size = 14,
  color = "#FFFFFF",
  filled = false
}: {
  size?: number;
  color?: string;
  filled?: boolean;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Rect
        x={0.75}
        y={0.75}
        width={16.5}
        height={16.5}
        rx={5}
        fill={filled ? color : "none"}
        stroke={filled ? "none" : color}
        strokeWidth={1.5}
      />
      <Path
        d="M5 9.2L7.6 11.8L13 6"
        stroke={filled ? "#FFFFFF" : color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function StepRow({ index, label }: { index: number; label: string }) {
  return (
    <View className="flex-row items-center gap-3 py-1.5">
      <View className="size-6 items-center justify-center rounded-full bg-concierge-surfaceMuted">
        <Text className="text-xs font-bold text-concierge-primary">{index}</Text>
      </View>
      <Text className="flex-1 text-sm text-concierge-text">{label}</Text>
    </View>
  );
}

export function CareGuideScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView className="flex-1 px-6" contentContainerClassName="pb-8">
        <View className="mt-3 flex-row items-center">
          <ScreenHeader title="관리 가이드" onBack={() => router.back()} className="flex-1" />
          <View className="rounded-full border border-concierge-primary px-2 py-1">
            <Text className="text-xs text-concierge-primary">Visetos</Text>
          </View>
        </View>

        <View className="mt-4 overflow-hidden rounded-2xl">
          <Image source={guideBg} className="h-[280px] w-full" resizeMode="cover" />
          <View className="absolute inset-0 bg-black/35" />
          <View className="absolute inset-0 justify-end p-4">
            <View className="mb-3 flex-row items-center gap-1.5 self-start rounded-full bg-white/20 px-2.5 py-1.5">
              <CheckSquareIcon size={13} color="#FFFFFF" />
              <Text className="text-xs font-medium text-white">지급 추천하는 관리</Text>
            </View>
            <Text className="text-2xl font-bold leading-8 text-white">
              이번 주에는 직사광선을 피해 통풍이 잘되는 공간에 보관하세요
            </Text>
            <Text className="mt-2 text-[13px] text-white/80">
              최근 사용 빈도가 높아 잠시 형태와 표면을 쉬어주는 것이 좋습니다.
            </Text>
          </View>
        </View>

        <View className="mt-5 flex-row items-center gap-1.5">
          <CheckSquareIcon size={16} color={colors.primary} filled />
          <Text className="text-xs font-medium text-concierge-textMuted">일상 관리</Text>
        </View>
        <Text className="mt-2 text-xl font-bold leading-7 text-concierge-text">
          마른 부드러운 천으로 표면 정돈
        </Text>
        <Text className="mt-2 text-[13px] leading-5 text-concierge-textMuted">
          먼지와 오염을 부드럽게 제거하여 가죽의 컨디션을 유지해 주세요.
        </Text>

        <View className="mt-4 border-t border-concierge-borderLight" />

        <Text className="mt-4 text-base font-bold text-concierge-text">이렇게 관리해주세요</Text>
        <View className="mt-1">
          {CARE_STEPS.map((step, i) => (
            <StepRow key={step} index={i + 1} label={step} />
          ))}
        </View>

        <Card className="mt-5 flex-row gap-2 border-0 bg-concierge-surfaceMuted px-4 py-3.5">
          <Text className="text-[13px] font-bold text-concierge-primary">TIP.</Text>
          <Text className="flex-1 text-[13px] leading-5 text-concierge-textSecondary">
            정기적으로 관리하면 가죽의 광택과 수명을 오래 유지할 수 있어요.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
