import { useEffect, useState } from "react";
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getOnboardingProducts,
  type OnboardingProductResponse,
} from "@/features/onboarding/api/onboardingApi";
import { useAuthStore } from "@/features/auth/store/authStore";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { CheckmarkCircleIcon } from "@/shared/components/icons/CheckmarkCircleIcon";

type OnboardingProduct = {
  id: string;
  productId: number;
  name: string;
  material: string;
  color: string;
  productCode: string;
  modelCode?: string;
  productImageUrl?: string | null;
};

function getProductImageSource(
  product: OnboardingProduct,
): ImageSourcePropType | null {
  return product.productImageUrl ? { uri: product.productImageUrl } : null;
}

function mapApiProductToOnboardingProduct(
  product: OnboardingProductResponse,
): OnboardingProduct {
  return {
    id: String(product.productId),
    productId: product.productId,
    name: product.productName,
    material: product.materialDisplayName,
    color: product.color ?? "",
    productCode: product.dppCode || product.modelCode || "",
    modelCode: product.modelCode ?? undefined,
    productImageUrl: product.productImageUrl,
  };
}

function SelectionControl({ selected }: { selected: boolean }) {
  if (selected) {
    return <CheckmarkCircleIcon size={22} color="#E4AB7C" />;
  }

  return (
    <View className="h-[22px] w-[22px] rounded-full border-[1.2px] border-concierge-border bg-white" />
  );
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
  const imageSource = getProductImageSource(product);

  return (
    <Pressable
      onPress={onPress}
      className={`h-[76px] flex-row items-center gap-3 overflow-hidden rounded-xl bg-white p-2.5 ${
        selected
          ? "border-[1.5px] border-concierge-primary"
          : "border border-concierge-border"
      }`}
    >
      <View className="h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-lg bg-concierge-bg">
        {imageSource ? (
          <Image
            source={imageSource}
            resizeMode="contain"
            style={{ height: 48, width: 48 }}
          />
        ) : (
          <Text className="text-[10px] text-concierge-textMuted">
            이미지 없음
          </Text>
        )}
      </View>

      <View className="min-w-0 flex-1 gap-0.5">
        <Text
          className="text-[13px] font-semibold text-concierge-text"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          allowFontScaling={false}
        >
          {product.name}
        </Text>
        <Text
          className="text-xs text-concierge-textSecondary"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.78}
          allowFontScaling={false}
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
  const { deviceId, deviceSerial } = useLocalSearchParams<{
    deviceId?: string;
    deviceSerial?: string;
  }>();
  const accessToken = useAuthStore((state) => state.accessToken);
  const tokenType = useAuthStore((state) => state.tokenType);
  const [products, setProducts] = useState<OnboardingProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      if (!accessToken) {
        setErrorMessage("로그인 정보가 없어 제품 목록을 불러올 수 없습니다.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");
        const response = await getOnboardingProducts(accessToken, tokenType);
        const nextProducts = response.map(mapApiProductToOnboardingProduct);

        if (!mounted) return;

        setProducts(nextProducts);
        setSelectedProductId(nextProducts[0]?.id ?? "");
      } catch (error) {
        if (!mounted) return;

        setProducts([]);
        setSelectedProductId("");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "제품 목록을 불러오지 못했습니다.",
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      mounted = false;
    };
  }, [accessToken, tokenType]);

  const handleConnectProduct = () => {
    const selectedProduct = products.find(
      (product) => product.id === selectedProductId,
    );

    if (!selectedProduct) {
      setErrorMessage("연결할 제품을 선택해 주세요.");
      return;
    }

    if (!deviceId || !deviceSerial) {
      setErrorMessage(
        "연결된 MXIS Charm 정보가 없습니다. Charm을 다시 연결해 주세요.",
      );
      return;
    }

    router.push({
      pathname: "/onboarding/product-confirm",
      params: {
        productId: String(selectedProduct.productId),
        productName: selectedProduct.name,
        material: selectedProduct.material,
        color: selectedProduct.color,
        productCode: selectedProduct.productCode,
        modelCode: selectedProduct.modelCode ?? "",
        productImageUrl: selectedProduct.productImageUrl ?? "",
        deviceId,
        deviceSerial,
      },
    });
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-concierge-bg">
      <StatusBar style="dark" backgroundColor="#FAF6F1" />

      <View className="mx-auto w-full max-w-[390px] flex-1 px-6 pb-6 pt-6">
        <View className="flex-1">
          <ScreenHeader
            title="연결할 제품을 선택해 주세요."
            titleClassName="text-lg"
            onBack={() => router.back()}
          />

          <Text className="mt-3 text-sm text-concierge-textSecondary">
            MCM 계정에 등록된 제품 중 MXIS Charm과 연결할 제품을 선택해 주세요.
          </Text>

          <View className="mt-4 flex-row items-center gap-2">
            <Text className="text-sm font-bold text-concierge-text">
              등록된 제품
            </Text>
            <View className="h-[22px] min-w-[22px] items-center justify-center rounded-full border border-concierge-primary bg-concierge-chip px-1.5">
              <Text
                className="text-xs font-medium text-concierge-primary"
                style={{ lineHeight: 16 }}
              >
                {products.length}
              </Text>
            </View>
          </View>

          <View className="mt-3 gap-2">
            {isLoading ? (
              <Text className="py-6 text-center text-sm text-concierge-textSecondary">
                제품 목록을 불러오고 있습니다.
              </Text>
            ) : null}
            {!isLoading && products.length === 0 ? (
              <Text className="py-6 text-center text-sm text-concierge-textSecondary">
                연결할 수 있는 제품이 없습니다.
              </Text>
            ) : null}
            {products.map((product) => (
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

        <View className="pt-5">
          {errorMessage ? (
            <Text className="mb-2 text-center text-xs font-medium text-[#C04737]">
              {errorMessage}
            </Text>
          ) : null}
          <PrimaryButton
            label={isLoading ? "불러오는 중입니다" : "선택한 제품 연결하기"}
            onPress={handleConnectProduct}
            disabled={isLoading || products.length === 0}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
