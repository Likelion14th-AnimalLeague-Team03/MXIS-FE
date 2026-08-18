import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/authStore";
import { getPrimaryProduct, getProducts } from "@/features/product/api/productApi";

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
  const primary = usePrimaryProduct();
  const needsFallback = primary.isSuccess && primary.data == null;
  const list = useProducts(needsFallback);

  const product = primary.data ?? list.data?.at(0) ?? null;
  const isAuthenticated = Boolean(accessToken);

  return {
    product,
    productId: product?.id ?? null,
    isAuthenticated,
    // 비로그인 상태에선 쿼리가 disabled라 계속 pending으로 남으니 로딩으로 보지 않아요.
    isPending:
      isAuthenticated && (primary.isPending || (needsFallback && list.isPending)),
    /** 조회는 끝났는데 등록된 제품이 하나도 없는 상태 */
    hasNoProduct: needsFallback && list.isSuccess && (list.data?.length ?? 0) === 0,
    error: primary.error ?? list.error,
  };
}

/** 화면에서 productId만 필요할 때 쓰는 간편 훅 */
export function usePrimaryProductId() {
  const { productId, isPending, error } = useCurrentProduct();

  return { productId, isPending, error };
}
