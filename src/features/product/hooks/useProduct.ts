import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useDeviceManagementSummary } from "@/features/device/hooks/useDevice";
import { getPrimaryProduct, getProducts } from "@/features/product/api/productApi";
import type { Product } from "@/features/product/types";

export const productQueryKeys = {
  primary: ["products", "primary"] as const,
  list: ["products", "list"] as const,
};

/** 대표 제품 — 등록된 제품이 있어도 isPrimary가 지정되지 않았으면 null이 올 수 있어요. */
export function usePrimaryProduct() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: productQueryKeys.primary,
    queryFn: getPrimaryProduct,
    enabled: Boolean(accessToken),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProducts(enabled = true) {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: productQueryKeys.list,
    queryFn: getProducts,
    enabled: Boolean(accessToken) && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 홈·케어·예약이 공통으로 쓰는 "지금 보고 있는 제품".
 * 대표 제품이 지정돼 있지 않은 계정도 있어서, 그때는 제품 목록의 첫 번째로 대체해요.
 */
export function useCurrentProduct() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const deviceSummary = useDeviceManagementSummary();
  const primary = usePrimaryProduct();
  const managedPrimaryProduct: Product | null =
    deviceSummary.data?.primaryProduct == null
      ? null
      : {
          id: deviceSummary.data.primaryProduct.productId,
          productName: deviceSummary.data.primaryProduct.productName,
          productImageUrl: deviceSummary.data.primaryProduct.productImageUrl,
          materialId: deviceSummary.data.primaryProduct.materialId,
          materialDisplayName:
            deviceSummary.data.primaryProduct.materialDisplayName,
          color: deviceSummary.data.primaryProduct.color,
          modelCode: deviceSummary.data.primaryProduct.modelCode,
          dppCode: deviceSummary.data.primaryProduct.dppCode,
        };

  // 기기 연동에서 지정한 메인 가방이 우선이고, 그게 없거나 조회 실패일 때만
  // 기존 /products/primary -> 제품 목록 순서로 한 번 더 시도해요.
  const needsFallback =
    deviceSummary.isSuccess && managedPrimaryProduct == null
      ? primary.isSuccess
        ? primary.data == null
        : primary.isError
      : deviceSummary.isError;
  const list = useProducts(needsFallback);

  const product =
    managedPrimaryProduct ?? primary.data ?? list.data?.at(0) ?? null;
  const isAuthenticated = Boolean(accessToken);
  const isPending =
    isAuthenticated &&
    (deviceSummary.isPending ||
      (needsFallback && (primary.isPending || list.isPending)));

  return {
    product,
    productId: product?.id ?? null,
    isAuthenticated,
    // 비로그인 상태에선 쿼리가 disabled라 계속 pending으로 남으니 로딩으로 보지 않아요.
    isPending,
    /** 조회는 끝났는데 등록된 제품이 하나도 없는 상태 */
    hasNoProduct:
      needsFallback &&
      list.isSuccess &&
      (list.data?.length ?? 0) === 0 &&
      product === null,
    /** 제품을 못 구한 이유 — 화면에 그대로 보여주면 원인 파악이 쉬워요. */
    error:
      product === null && !isPending
        ? (deviceSummary.error ?? primary.error ?? list.error)
        : null,
  };
}

/** 화면에서 productId만 필요할 때 쓰는 간편 훅 */
export function usePrimaryProductId() {
  const { productId, isPending, error } = useCurrentProduct();

  return { productId, isPending, error };
}
