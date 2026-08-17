import { Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { CheckmarkCircleIcon } from "@/shared/components/icons/CheckmarkCircleIcon";

export function CharmConnectedScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();

  const handleNext = () => {
    if (returnTo === "device") {
      router.replace("/(tabs)/device");
      return;
    }

    router.push("/onboarding/product-select");
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-concierge-bg">
      <StatusBar style="dark" backgroundColor="#FAF6F1" />

      <View className="flex-1 px-6 pb-7">
        <View className="flex-1 items-center justify-center">
          <CheckmarkCircleIcon size={56} color="#E4AB7C" />

          <Text className="mt-5 w-full text-center text-2xl font-bold text-concierge-text">
            연결이 완료되었습니다.
          </Text>

          <Text className="mt-3 w-[300px] text-center text-sm text-concierge-textSecondary">
            이제부터 MXIS Charm과 함께한 환경과 시간을 기록하고, 필요한 순간에
            케어를 제안해 드립니다.
          </Text>
        </View>

        <View className="items-center pb-2">
          <PrimaryButton label="다음" onPress={handleNext} className="w-full" />
        </View>
      </View>
    </SafeAreaView>
  );
}
