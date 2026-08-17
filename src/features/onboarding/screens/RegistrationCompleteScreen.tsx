import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { getOnboardingProductById } from "@/features/onboarding/data/mockProducts";
import {
  completeCharmOnboarding,
  getPrimaryCharmProductLink,
  type PrimaryCharmProductLink,
} from "@/features/onboarding/storage";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { CheckmarkCircleIcon } from "@/shared/components/icons/CheckmarkCircleIcon";

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <Text
        className="text-[14px] font-normal text-[#63635E]"
        style={{ letterSpacing: -0.14, lineHeight: 20 }}
      >
        {label}
      </Text>
      <Text
        className="flex-1 text-right text-[14px] font-medium text-[#121212]"
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{ letterSpacing: -0.14, lineHeight: 20 }}
      >
        {value}
      </Text>
    </View>
  );
}

export function RegistrationCompleteScreen() {
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const fallbackProduct = getOnboardingProductById(productId);
  const [link, setLink] = useState<PrimaryCharmProductLink | null>(null);

  useEffect(() => {
    getPrimaryCharmProductLink().then(setLink);
  }, []);

  const charmName = link?.charmName ?? "SN-0001";
  const productName = link?.productName ?? fallbackProduct.name.replace("\n", " ");
  const material = link?.material ?? fallbackProduct.material;

  const handleStartCareJourney = async () => {
    await completeCharmOnboarding();
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-concierge-bg">
      <StatusBar style="dark" backgroundColor="#FAF6F1" />

      <View className="mx-auto min-h-full w-full max-w-[390px] px-6 pb-7 pt-[132px]">
        <View className="items-center">
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
            이제부터 제품과 함께한 환경과 시간을 기록하고, 필요한 순간에 케어를
            제안해 드립니다.
          </Text>
        </View>

        <View className="mt-[30px] rounded-[14px] bg-[#F6F5F2] p-4">
          <View className="flex-row items-center gap-2">
            <View className="h-2 w-2 rounded-full bg-[#2F684A]" />
            <Text
              className="text-[14px] font-medium text-[#121212]"
              style={{ letterSpacing: -0.14, lineHeight: 20 }}
            >
              <Text className="font-bold">{charmName}</Text> 연결됨
            </Text>
          </View>

          <View className="mt-[10px] gap-[10px]">
            <SummaryRow label="제품" value={productName} />
            <SummaryRow label="소재" value={material} />
            <SummaryRow label="동기화" value="자동 기록 시작" />
          </View>
        </View>

        <View className="mt-auto mb-[38px]">
          <PrimaryButton
            label="케어 여정 시작하기"
            onPress={handleStartCareJourney}
            className="h-[50px] rounded-[10px]"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
