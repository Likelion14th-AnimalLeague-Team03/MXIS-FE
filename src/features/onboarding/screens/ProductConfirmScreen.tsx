import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { getOnboardingProductById } from "@/features/onboarding/data/mockProducts";
import { savePrimaryCharmProductLink } from "@/features/onboarding/storage";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { SecondaryButton } from "@/shared/components/SecondaryButton";

function ProductInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <Text
        className="text-[14px] font-semibold text-[#63635E]"
        style={{ letterSpacing: -0.35, lineHeight: 20 }}
      >
        {label}
      </Text>
      <Text
        className="flex-1 text-right text-[14px] font-semibold text-[#121212]"
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{ letterSpacing: -0.35, lineHeight: 20 }}
      >
        {value}
      </Text>
    </View>
  );
}

export function ProductConfirmScreen() {
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const product = getOnboardingProductById(productId);

  const handleConfirmProduct = async () => {
    await savePrimaryCharmProductLink({
      charmName: "SN-0001",
      productId: product.id,
      productName: product.name.replace("\n", " "),
      material: product.material,
      color: product.color,
      productCode: product.productCode,
      linkedAt: new Date().toISOString(),
    });

    router.push({
      pathname: "/onboarding/notification-permission",
      params: { productId: product.id },
    });
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-concierge-bg">
      <StatusBar style="dark" backgroundColor="#FAF6F1" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mx-auto min-h-full w-full max-w-[390px] px-6 pb-7 pt-[72px]">
          <Text
            className="text-[24px] font-bold text-[#121212]"
            style={{ letterSpacing: -0.6, lineHeight: 34 }}
          >
            연결할 제품을 확인해 주세요.
          </Text>

          <View className="mt-[64px] h-[217px] items-center justify-center">
            <Image
              source={product.detailImage}
              resizeMode="contain"
              style={{ height: 217, width: 284 }}
            />
          </View>

          <View className="mt-[78px] rounded-[12px] border border-[#DBDBD6] bg-white px-4 py-[15px]">
            <Text
              className="text-[14px] font-semibold text-[#121212]"
              style={{ letterSpacing: -0.35, lineHeight: 20 }}
            >
              {product.name.replace("\n", " ")}
            </Text>

            <View className="mt-[9px] gap-[9px]">
              <ProductInfoRow label="소재" value={product.material} />
              <ProductInfoRow label="색상" value={product.color} />
              <ProductInfoRow label="제품 코드" value={product.productCode} />
            </View>
          </View>

          <View className="mt-auto gap-2 pt-[68px]">
            <PrimaryButton
              label="네, 이 제품과 연결할게요"
              onPress={handleConfirmProduct}
              className="h-[52px] rounded-[10px]"
            />
            <SecondaryButton
              label="다른 제품 선택"
              onPress={() => router.back()}
              className="h-[52px] rounded-[10px]"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
