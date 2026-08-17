import { Linking, Pressable, Text, View } from "react-native";
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
    description:
      "배터리가 부족하면 연결이 원활하지 않을 수 있어요.\n충전 후 다시 연결해 주세요.",
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
    <View
      className={isLast ? "pb-0" : "border-b border-concierge-borderLight pb-4"}
    >
      <View className="flex-row items-start">
        <Text className="w-6 text-sm font-bold text-concierge-primary">
          {number}
        </Text>
        <View className="flex-1">
          <Text className="text-sm font-bold text-concierge-text">{title}</Text>
          <Text className="mt-2 mb-3 text-xs text-concierge-textMuted">
            {description}
          </Text>
          {actionLabel ? (
            <Pressable
              onPress={() => Linking.openSettings()}
              className="mt-2.5 h-7 items-center justify-center self-start rounded-lg bg-concierge-surfaceMuted px-3"
            >
              <Text
                className="text-xs font-semibold text-concierge-primary"
                style={{ lineHeight: 16 }}
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
      <View className="flex-1 px-6 pb-6 pt-6">
        <View className="flex-1">
          <ScreenHeader title="연결 도움말" onBack={() => router.back()} />
          <View className="px-6">
            <Text className="mt-5 text-lg font-bold text-concierge-text">
              MXIS Charm이 연결되지 않나요?
            </Text>
            <Text className="mt-1 text-sm text-concierge-textMuted">
              아래 순서대로 차근차근 확인해 주세요.
            </Text>

            <View className="mt-5  gap-8">
              {HELP_STEPS.map((step, index) => (
                <HelpStep
                  key={step.number}
                  {...step}
                  isLast={index === HELP_STEPS.length - 1}
                />
              ))}
            </View>

            <View className="mt-6 rounded-xl bg-concierge-surfaceMuted px-4 py-3">
              <View className="flex-row  items-start">
                <Text className="mr-3 text-xs font-bold text-concierge-textMuted">
                  TIP
                </Text>
                <Text className="flex-1 text-xs text-concierge-textMuted ">
                  연결 중에는 Charm을 가방에서 분리해 휴대폰 가까이 두면 더
                  빠르게 찾을 수 있어요.
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View>
          <PrimaryButton label="다시 검색" onPress={() => router.back()} />
          <Pressable onPress={() => undefined} className="mt-3 items-center">
            <Text className="text-sm font-semibold text-concierge-textMuted">
              그래도 연결되지 않나요? 고객센터 문의하기
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
