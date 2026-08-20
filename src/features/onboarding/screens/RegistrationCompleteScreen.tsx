import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  completeCharmOnboarding,
  getPrimaryCharmProductLink,
  type PrimaryCharmProductLink,
} from "@/features/onboarding/storage";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { CheckmarkCircleIcon } from "@/shared/components/icons/CheckmarkCircleIcon";

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <Text className="text-sm text-concierge-textSecondary">{label}</Text>
      <Text
        className="flex-1 text-right text-sm font-medium text-concierge-text"
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value || "-"}
      </Text>
    </View>
  );
}

export function RegistrationCompleteScreen() {
  const router = useRouter();
  const [link, setLink] = useState<PrimaryCharmProductLink | null>(null);

  useEffect(() => {
    getPrimaryCharmProductLink().then(setLink);
  }, []);

  const charmName = link?.charmName ?? "-";
  const productName = link?.productName ?? "-";
  const material = link?.material ?? "-";

  const handleStartCareJourney = async () => {
    await completeCharmOnboarding();
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-concierge-bg">
      <StatusBar style="dark" backgroundColor="#FAF6F1" />

      <View className="flex-1 px-6 pb-7 pt-6">
        <ScreenHeader title="" onBack={() => router.back()} />

        <View className="flex-1 items-center justify-center">
          <CheckmarkCircleIcon size={56} color="#E4AB7C" />

          <Text className="mt-5 w-full text-center text-[22px] font-bold text-concierge-text">
            연결이 완료되었습니다.
          </Text>

          <Text className="mt-3 w-[300px] text-center text-sm text-concierge-textSecondary">
            이제부터 제품과 함께한 환경과 시간을 기록하고, 필요한 순간에 케어를
            제안해 드립니다.
          </Text>

          <View className="mt-6 w-full rounded-xl bg-concierge-chip p-4">
            <View className="flex-row items-center gap-2">
              <View className="h-2 w-2 rounded-full bg-[#2F684A]" />
              <Text className="text-sm text-concierge-text">
                <Text className="font-bold">{charmName}</Text> 연결됨
              </Text>
            </View>

            <View className="mt-2.5 gap-2">
              <SummaryRow label="제품" value={productName} />
              <SummaryRow label="소재" value={material} />
              <SummaryRow label="동기화" value="자동 기록 시작" />
            </View>
          </View>
        </View>

        <View className="pb-2">
          <PrimaryButton
            label="케어 여정 시작하기"
            onPress={handleStartCareJourney}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
