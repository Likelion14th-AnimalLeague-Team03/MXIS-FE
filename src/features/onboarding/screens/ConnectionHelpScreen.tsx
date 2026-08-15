import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { ScreenHeader } from "@/shared/components/ScreenHeader";

const HELP_STEPS = [
  {
    number: "01",
    title: "Charm을 가까이 두세요",
    description: "휴대폰과 약 30cm 이내에서 다시 검색해 주세요.",
  },
  {
    number: "02",
    title: "Bluetooth 권한을 확인하세요",
    description: "Bluetooth 연결 권한이 켜져 있어야 해요.",
    actionLabel: "설정 확인",
  },
  {
    number: "03",
    title: "Charm 배터리를 확인하세요",
    description: "배터리가 부족하면 연결이 원활하지 않을 수 있어요.\n충전 후 다시 연결해 주세요.",
  },
  {
    number: "04",
    title: "다시 연결해 보세요",
    description: "Charm을 재시작한 뒤 앱에서 다시 검색해 주세요.",
  },
];

function HelpStep({
  number,
  title,
  description,
  actionLabel,
  isLast,
}: {
  number: string;
  title: string;
  description: string;
  actionLabel?: string;
  isLast?: boolean;
}) {
  return (
    <View className={isLast ? "pb-0" : "border-b border-[#E7DED7] pb-6"}>
      <View className="flex-row items-start">
        <Text
          className="w-[28px] text-[13px] font-bold text-concierge-primary"
          style={{ letterSpacing: -0.32, lineHeight: 20 }}
        >
          {number}
        </Text>
        <View className="flex-1">
          <Text
            className="text-[15px] font-bold text-[#201C19]"
            style={{ letterSpacing: -0.38, lineHeight: 21 }}
          >
            {title}
          </Text>
          <Text
            className="mt-2 text-[13px] font-medium text-[#77716C]"
            style={{ letterSpacing: -0.32, lineHeight: 22 }}
          >
            {description}
          </Text>
          {actionLabel ? (
            <Pressable
              onPress={() => Linking.openSettings()}
              className="mt-4 h-[30px] w-[95px] items-center justify-center rounded-[10px] bg-[#F2EBE5]"
            >
              <Text
                className="text-[12px] font-semibold text-concierge-primary"
                style={{ letterSpacing: -0.3 }}
              >
                {actionLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function ConnectionHelpScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-concierge-bg">
      <StatusBar style="dark" backgroundColor="#FAF6F1" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="min-h-full px-6 pb-7 pt-[66px]"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="연결 도움말" onBack={() => router.back()} />

        <Text
          className="mt-8 text-[16px] font-bold text-[#201C19]"
          style={{ letterSpacing: -0.4, lineHeight: 22 }}
        >
          MXIS Charm이 연결되지 않나요?
        </Text>
        <Text
          className="mt-2 text-[13px] font-medium text-[#77716C]"
          style={{ letterSpacing: -0.32, lineHeight: 22 }}
        >
          아래 순서대로 차근차근 확인해 주세요.
        </Text>

        <View className="mt-6 gap-6">
          {HELP_STEPS.map((step, index) => (
            <HelpStep
              key={step.number}
              {...step}
              isLast={index === HELP_STEPS.length - 1}
            />
          ))}
        </View>

        <View className="mt-10 rounded-[12px] bg-[#F2EBE5] px-5 py-4">
          <View className="flex-row items-start">
            <Text
              className="mr-4 text-[13px] font-bold text-[#514B46]"
              style={{ letterSpacing: -0.32, lineHeight: 22 }}
            >
              TIP
            </Text>
            <Text
              className="flex-1 text-[12px] font-medium text-[#77716C]"
              style={{ letterSpacing: -0.3, lineHeight: 21 }}
            >
              연결 중에는 Charm을 가방에서 분리해 휴대폰 가까이 두면 더 빠르게
              찾을 수 있어요.
            </Text>
          </View>
        </View>

        <View className="mt-auto pt-10">
          <PrimaryButton
            label="다시 검색"
            onPress={() => router.back()}
            className="h-[52px] rounded-[10px]"
          />
          <Pressable onPress={() => undefined} className="mt-4 items-center">
            <Text
              className="text-[14px] font-semibold text-[#77716C]"
              style={{ letterSpacing: -0.35, lineHeight: 22 }}
            >
              그래도 연결되지 않나요? 고객센터 문의하기
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
