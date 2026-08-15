import { Image, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import charmOnboardingDevice from "@/features/onboarding/assets/charm-onboarding-device.png";
import { PrimaryButton } from "@/shared/components/PrimaryButton";

function CharmDevicePreview() {
  return (
    <View className="mt-[62px] h-[258px] items-center justify-center overflow-visible">
      <Image
        source={charmOnboardingDevice}
        className="h-[246px] w-[246px]"
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
    <View className="rounded-[12px] border border-white/70 bg-white px-5 py-[17px]">
      <Text
        className="text-[16px] font-bold text-[#201C19]"
        style={{ letterSpacing: -0.4 }}
      >
        {title}
      </Text>
      <Text
        className="mt-2 text-[15px] font-medium text-[#6E6964]"
        style={{ letterSpacing: -0.38, lineHeight: 22 }}
      >
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
      <ScrollView
        className="flex-1"
        contentContainerClassName="min-h-full px-6 pb-7 pt-[72px]"
        showsVerticalScrollIndicator={false}
      >
        <Text
          className="text-[24px] font-bold text-[#171310]"
          style={{ letterSpacing: -0.6, lineHeight: 32 }}
        >
          MXIS Charm을 연결해 주세요.
        </Text>
        <Text
          className="mt-7 text-[16px] font-semibold text-[#6E6964]"
          style={{ letterSpacing: -0.4, lineHeight: 26 }}
        >
          가방 가까이에 Charm을 두면 연결되는 순간부터 제품과 함께한 환경과
          시간이 기록됩니다.
        </Text>

        <CharmDevicePreview />

        <View className="mt-[62px] gap-[10px]">
          <InfoCard
            title="Bluetooth 연결"
            description="가까이 있는 MXIS Charm을 안전하게 찾습니다."
          />
          <InfoCard
            title="자동 기록"
            description="온·습도와 움직임 기록은 Charm에 누적됩니다."
          />
        </View>

        <View className="mt-auto pt-[62px]">
          <PrimaryButton
            label="MXIS Charm 연결하기"
            onPress={() => router.push("/onboarding/bluetooth-permission")}
            className="h-[60px] rounded-[10px]"
          />
          <Text
            className="mt-4 text-center text-[15px] font-semibold text-[#6E6964]"
            style={{ letterSpacing: -0.38, lineHeight: 22 }}
          >
            연결 과정은 약 1분 정도 걸릴 수 있습니다.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
