import { Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { completeCharmOnboarding } from "@/features/onboarding/storage";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { CheckmarkCircleIcon } from "@/shared/components/icons/CheckmarkCircleIcon";

export function CharmConnectedScreen() {
  const router = useRouter();

  const handleNext = async () => {
    await completeCharmOnboarding();
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-concierge-bg">
      <StatusBar style="dark" backgroundColor="#FAF6F1" />

      <View className="flex-1 px-6 pb-7">
        <View className="flex-1 items-center justify-center pt-[66px]">
          <View className="mb-[23px] h-12 w-px" />
          <CheckmarkCircleIcon size={67} color="#E4AB7C" />

          <Text
            className="mt-[23px] w-full text-center text-[24px] font-bold text-[#121212]"
            style={{ letterSpacing: -0.6, lineHeight: 34 }}
          >
            연결이 완료되었습니다.
          </Text>

          <Text
            className="mt-[23px] w-[320px] text-center text-[14px] font-normal text-[#63635E]"
            style={{ letterSpacing: -0.14, lineHeight: 20 }}
          >
            이제부터 MXIS Charm과 함께한 환경과 시간을 기록하고, 필요한 순간에 케어를
            제안해 드립니다.
          </Text>
        </View>

        <View className="mb-[40px] items-center">
          <View className="mb-[22px] h-[26px] w-px bg-white" />
          <PrimaryButton
            label="다음"
            onPress={handleNext}
            className="h-[50px] w-full rounded-[10px]"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
