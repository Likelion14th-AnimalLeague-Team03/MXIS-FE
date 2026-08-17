import { Image, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import charmOnboardingDevice from "@/features/onboarding/assets/charm-onboarding-device.png";
import { PrimaryButton } from "@/shared/components/PrimaryButton";

function CharmDevicePreview() {
  return (
    <View className="mt-6 h-[190px] items-center justify-center overflow-visible">
      <Image
        source={charmOnboardingDevice}
        className="h-[180px] w-[180px]"
        resizeMode="contain"
      />
    </View>
  );
}

function InfoCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View className="rounded-xl border border-concierge-borderLight bg-white px-4 py-3.5">
      <Text className="text-sm font-bold text-concierge-text">{title}</Text>
      <Text className="mt-1.5 text-sm text-concierge-textSecondary">
        {description}
      </Text>
    </View>
  );
}

export function CharmOnboardingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-concierge-bg">
      <StatusBar style="dark" backgroundColor="#FAF6F1" />
      <View className="flex-1 px-6 pb-6 pt-6">
        <View className="flex-1">
          <Text className="text-xl font-bold text-concierge-text">
            MXIS Charm을 연결해 주세요.
          </Text>
          <Text className="mt-3 text-sm text-concierge-textSecondary">
            가방 가까이에 Charm을 두면 연결되는 순간부터 제품과 함께한 환경과
            시간이 기록됩니다.
          </Text>

          <CharmDevicePreview />

          <View className="mt-4 gap-2.5">
            <InfoCard
              title="Bluetooth 연결"
              description="가까이 있는 MXIS Charm을 안전하게 찾습니다."
            />
            <InfoCard
              title="자동 기록"
              description="온·습도와 움직임 기록은 Charm에 누적됩니다."
            />
          </View>
        </View>

        <View>
          <PrimaryButton
            label="MXIS Charm 연결하기"
            onPress={() => router.push("/onboarding/bluetooth-permission")}
          />
          <Text className="mt-3 text-center text-sm text-concierge-textSecondary">
            연결 과정은 약 1분 정도 걸릴 수 있습니다.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
