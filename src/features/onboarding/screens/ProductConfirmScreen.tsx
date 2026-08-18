import { useState } from "react";
import { Image, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { getOnboardingProductById } from "@/features/onboarding/data/mockProducts";
import { savePrimaryCharmProductLink } from "@/features/onboarding/storage";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { SecondaryButton } from "@/shared/components/SecondaryButton";

const MOCK_CONNECTED_DEVICE_ID = 33;
const MOCK_CONNECTED_DEVICE_SERIAL = "SN-0033";

function ProductInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <Text className="text-sm font-semibold text-concierge-textSecondary">
        {label}
      </Text>
      <Text
        className="flex-1 text-right text-sm font-semibold text-concierge-text"
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

export function ProductConfirmScreen() {
  const router = useRouter();
  const {
    color,
    deviceId,
    deviceSerial,
    material,
    productCode,
    productId,
    productImageUrl,
    productName,
  } = useLocalSearchParams<{
    color?: string;
    deviceId?: string;
    deviceSerial?: string;
    material?: string;
    productCode?: string;
    productId?: string;
    productImageUrl?: string;
    productName?: string;
  }>();
  const fallbackProduct = getOnboardingProductById(productId);
  const product = {
    id: productId ?? fallbackProduct.id,
    productId: Number(productId ?? fallbackProduct.productId),
    name: productName ?? fallbackProduct.name.replace("\n", " "),
    material: material ?? fallbackProduct.material,
    color: color ?? fallbackProduct.color,
    productCode: productCode ?? fallbackProduct.productCode,
    productImage:
      productImageUrl && productImageUrl.length > 0
        ? { uri: productImageUrl }
        : fallbackProduct.detailImage,
  };
  const numericDeviceId = Number(deviceId ?? MOCK_CONNECTED_DEVICE_ID);
  const linkedDeviceSerial = deviceSerial || MOCK_CONNECTED_DEVICE_SERIAL;
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmProduct = async () => {
    if (!Number.isFinite(product.productId) || !Number.isFinite(numericDeviceId)) {
      setErrorMessage("제품 또는 Charm 정보를 확인할 수 없습니다. 다시 연결해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    await savePrimaryCharmProductLink({
      charmName: linkedDeviceSerial,
      productId: String(product.productId),
      productName: product.name,
      material: product.material,
      color: product.color,
      productCode: product.productCode,
      linkedAt: new Date().toISOString(),
    });

    router.push({
      pathname: "/onboarding/notification-permission",
      params: {
        productId: product.id,
        deviceId: String(numericDeviceId),
        deviceSerial: linkedDeviceSerial,
      },
    });

    setIsSubmitting(false);
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-concierge-bg">
      <StatusBar style="dark" backgroundColor="#FAF6F1" />

      <View className="mx-auto w-full max-w-[390px] flex-1 px-6 pb-6 pt-6">
        <View className="flex-1">
          <Text className="text-2xl font-bold text-concierge-text">
            연결할 제품을 확인해 주세요.
          </Text>

          <View className="mt-6 h-[170px] items-center justify-center">
            <Image
              source={product.productImage}
              resizeMode="contain"
              style={{ height: 170, width: 222 }}
            />
          </View>

          <View className="mt-6 rounded-xl border border-concierge-border bg-white px-4 py-3.5">
            <Text className="text-sm font-semibold text-concierge-text">
              {product.name}
            </Text>

            <View className="mt-2 gap-2">
              <ProductInfoRow label="소재" value={product.material} />
              <ProductInfoRow label="색상" value={product.color} />
              <ProductInfoRow label="제품 코드" value={product.productCode} />
            </View>
          </View>
        </View>

        <View className="gap-2">
          {errorMessage ? (
            <Text className="text-center text-xs font-medium text-[#C04737]">
              {errorMessage}
            </Text>
          ) : null}
          <PrimaryButton
            label={isSubmitting ? "연결 중입니다" : "네, 이 제품과 연결할게요"}
            onPress={handleConfirmProduct}
            disabled={isSubmitting}
          />
          <SecondaryButton label="다른 제품 선택" onPress={() => router.back()} />
        </View>
      </View>
    </SafeAreaView>
  );
}
