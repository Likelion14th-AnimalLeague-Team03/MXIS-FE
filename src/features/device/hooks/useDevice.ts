import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/authStore";
import { getDeviceManagementSummary } from "@/features/device/api/deviceApi";
import type { Product } from "@/features/product/types";

export const deviceQueryKeys = {
  summary: ["device", "summary"] as const,
};

export function useDeviceManagementSummary() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: deviceQueryKeys.summary,
    queryFn: getDeviceManagementSummary,
    enabled: Boolean(accessToken),
    staleTime: 60 * 1000,
  });
}

export function useManagedPrimaryProduct() {
  const isAuthenticated = useAuthStore((state) => Boolean(state.accessToken));
  const summary = useDeviceManagementSummary();

  const product: Product | null =
    summary.data?.primaryProduct == null
      ? null
      : {
          id: summary.data.primaryProduct.productId,
          productName: summary.data.primaryProduct.productName,
          productImageUrl: summary.data.primaryProduct.productImageUrl,
          materialId: summary.data.primaryProduct.materialId,
          materialDisplayName: summary.data.primaryProduct.materialDisplayName,
          color: summary.data.primaryProduct.color,
          modelCode: summary.data.primaryProduct.modelCode,
          dppCode: summary.data.primaryProduct.dppCode,
        };

  return {
    ...summary,
    isAuthenticated,
    product,
    productId: product?.id ?? null,
  };
}
