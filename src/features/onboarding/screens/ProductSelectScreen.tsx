import { useState } from "react";
import {
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  MOCK_ONBOARDING_PRODUCTS,
  type OnboardingProduct,
} from "@/features/onboarding/data/mockProducts";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { SecondaryButton } from "@/shared/components/SecondaryButton";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { CheckmarkCircleIcon } from "@/shared/components/icons/CheckmarkCircleIcon";

function SelectionControl({ selected }: { selected: boolean }) {
  if (selected) {
    return <CheckmarkCircleIcon size={22} color="#E4AB7C" />;
  }

  return <View className="h-[22px] w-[22px] rounded-full border-[1.2px] border-concierge-border bg-white" />;
}

function ProductCard({
  product,
  selected,
  onPress,
}: {
  product: OnboardingProduct;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-[76px] flex-row items-center gap-3 overflow-hidden rounded-xl bg-white p-2.5 ${
        selected ? "border-[1.5px] border-concierge-primary" : "border border-concierge-border"
      }`}
    >
      <View className="h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-lg bg-concierge-bg">
        <Image
          source={product.thumbnail}
          resizeMode="contain"
          style={{ height: 48, width: 48 }}
        />
      </View>

      <View className="min-w-0 flex-1 gap-0.5">
        <Text className="text-sm font-semibold text-concierge-text" numberOfLines={2}>
          {product.name}
        </Text>
        <Text className="text-xs text-concierge-textSecondary" numberOfLines={1}>
          {product.material} · {product.color}
        </Text>
      </View>

      <SelectionControl selected={selected} />
    </Pressable>
  );
}

// 스크롤 없이 화면 안에 항상 다 들어오도록, ScrollView 대신 고정 flex 레이아웃을 씁니다.
export function ProductSelectScreen() {
  const router = useRouter();
  const [selectedProductId, setSelectedProductId] = useState(
    MOCK_ONBOARDING_PRODUCTS[0]?.id ?? "",
  );

  const handleConnectProduct = () => {
    router.push({
      pathname: "/onboarding/product-confirm",
      params: { productId: selectedProductId },
    });
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-concierge-bg">
      <StatusBar style="dark" backgroundColor="#FAF6F1" />

      <View className="mx-auto w-full max-w-[390px] flex-1 px-6 pb-6 pt-6">
        <View className="flex-1">
          <ScreenHeader title="연결할 제품을 선택해 주세요." onBack={() => router.back()} />

          <Text className="mt-3 text-sm text-concierge-textSecondary">
            MCM 계정에 등록된 제품 중 MXIS Charm과 연결할 제품을 선택해 주세요.
          </Text>

          <View className="mt-4 flex-row items-center gap-2">
            <Text className="text-sm font-bold text-concierge-text">등록된 제품</Text>
            <View className="h-[22px] min-w-[22px] items-center justify-center rounded-full border border-concierge-primary bg-concierge-chip px-1.5">
              <Text
                className="text-xs font-medium text-concierge-primary"
                style={{ lineHeight: 16 }}
              >
                {MOCK_ONBOARDING_PRODUCTS.length}
              </Text>
            </View>
          </View>

          <View className="mt-3 gap-2">
            {MOCK_ONBOARDING_PRODUCTS.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                selected={product.id === selectedProductId}
                onPress={() => setSelectedProductId(product.id)}
              />
            ))}
          </View>

          <View className="mt-4 rounded-xl bg-white px-3.5 py-2.5">
            <Text className="text-sm font-semibold text-concierge-text">
              표시되는 제품
            </Text>
            <Text className="mt-1 text-sm text-concierge-textSecondary">
              구매 이력 또는 등록된 제품만 목록에 표시됩니다.
            </Text>
          </View>
        </View>

        <View className="gap-2">
          <PrimaryButton label="선택한 제품 연결하기" onPress={handleConnectProduct} />
          <SecondaryButton label="제품 다시 인식" onPress={() => {}} />
        </View>
      </View>
    </SafeAreaView>
  );
}
