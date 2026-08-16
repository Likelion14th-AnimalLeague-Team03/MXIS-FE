import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
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
import { BackChevronIcon } from "@/shared/components/icons/BackChevronIcon";
import { CheckmarkCircleIcon } from "@/shared/components/icons/CheckmarkCircleIcon";

function SelectionControl({ selected }: { selected: boolean }) {
  if (selected) {
    return <CheckmarkCircleIcon size={24} color="#E4AB7C" />;
  }

  return <View className="h-6 w-6 rounded-full border-[1.2px] border-[#DBDBD6] bg-white" />;
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
      className={`h-[92px] flex-row items-center gap-3 overflow-hidden rounded-[12px] bg-white p-3 ${
        selected ? "border-[1.5px] border-[#814C27]" : "border border-[#DBDBD6]"
      }`}
    >
      <View className="h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-[10px] bg-[#FAF6F1]">
        <Image
          source={product.thumbnail}
          resizeMode="contain"
          style={{ height: 64, width: 64 }}
        />
      </View>

      <View className="min-w-0 flex-1 gap-[3px]">
        <Text
          className="text-[14px] font-semibold text-[#121212]"
          numberOfLines={2}
          style={{ letterSpacing: -0.35, lineHeight: 20 }}
        >
          {product.name}
        </Text>
        <Text
          className="text-[12px] font-normal text-[#63635E]"
          numberOfLines={1}
          style={{ letterSpacing: -0.08, lineHeight: 17 }}
        >
          {product.material} · {product.color}
        </Text>
      </View>

      <SelectionControl selected={selected} />
    </Pressable>
  );
}

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

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mx-auto min-h-full w-full max-w-[390px] px-6 pb-7 pt-[72px]">
        <View className="flex-row items-center gap-[14px]">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="h-7 w-3 justify-center"
          >
            <BackChevronIcon size={10} color="#111111" />
          </Pressable>
          <Text
            className="text-[20px] font-bold text-[#121212]"
            style={{ letterSpacing: -0.4, lineHeight: 28 }}
          >
            연결할 제품을 선택해 주세요.
          </Text>
        </View>

        <Text
          className="mt-[19px] text-[14px] font-normal text-[#63635E]"
          style={{ letterSpacing: -0.1, lineHeight: 20 }}
        >
          MCM 계정에 등록된 제품 중 MXIS Charm과 연결할 제품을 선택해 주세요.
        </Text>

        <View className="mt-[24px] flex-row items-center gap-[10px]">
          <Text
            className="text-[14px] font-bold text-[#121212]"
            style={{ letterSpacing: -0.1, lineHeight: 20 }}
          >
            등록된 제품
          </Text>
          <View className="h-[22px] min-w-[22px] items-center justify-center rounded-full border border-[#814C27] bg-[#F6F5F2] px-[7px]">
            <Text
              className="text-[12px] font-medium text-[#814C27]"
              style={{ letterSpacing: -0.08, lineHeight: 17 }}
            >
              {MOCK_ONBOARDING_PRODUCTS.length}
            </Text>
          </View>
        </View>

        <View className="mt-[28px] gap-[10px]">
          {MOCK_ONBOARDING_PRODUCTS.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              selected={product.id === selectedProductId}
              onPress={() => setSelectedProductId(product.id)}
            />
          ))}
        </View>

        <View className="mt-[72px] rounded-[12px] bg-white px-[14px] py-3">
          <Text
            className="text-[14px] font-semibold text-[#121212]"
            style={{ letterSpacing: -0.35, lineHeight: 20 }}
          >
            표시되는 제품
          </Text>
          <Text
            className="mt-1 text-[14px] font-medium text-[#63635E]"
            style={{ letterSpacing: -0.35, lineHeight: 20 }}
          >
            구매 이력 또는 등록된 제품만 목록에 표시됩니다.
          </Text>
        </View>

        <View className="mt-auto gap-2 pt-[22px]">
          <PrimaryButton
            label="선택한 제품 연결하기"
            onPress={handleConnectProduct}
            className="h-[52px] rounded-[10px]"
          />
          <SecondaryButton
            label="제품 다시 인식"
            onPress={() => {}}
            className="h-[52px] rounded-[10px]"
          />
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
