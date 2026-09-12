import { useEffect, useState } from "react";

import { useAuthStore } from "@/features/auth/store/authStore";
import {
  getOnboardingProducts,
  type OnboardingProductResponse,
} from "@/features/onboarding/api/onboardingApi";
import type { OnboardingProduct } from "@/features/onboarding/types";

function toOnboardingProduct(
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

export function useOnboardingProducts() {
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
        const nextProducts = response.map(toOnboardingProduct);

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

    void loadProducts();

    return () => {
      mounted = false;
    };
  }, [accessToken, tokenType]);

  return {
    errorMessage,
    isLoading,
    products,
    selectedProductId,
    selectProduct: setSelectedProductId,
    setErrorMessage,
  };
}
