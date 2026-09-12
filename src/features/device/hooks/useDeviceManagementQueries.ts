import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/authStore";
import {
  getDeviceManagementSummary,
  getDevices,
  getProductDevices,
  getProductDeviceManagementSummary,
  getProducts,
} from "@/features/device/api/deviceApi";
import { deviceQueryKeys } from "@/features/device/queryKeys";

export function useDeviceManagementQueries(productId: number | null) {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => Boolean(state.accessToken));

  const summaryQuery = useQuery({
    queryKey: deviceQueryKeys.summary,
    queryFn: getDeviceManagementSummary,
    enabled: isAuthenticated,
  });
  const productsQuery = useQuery({
    queryKey: deviceQueryKeys.products,
    queryFn: getProducts,
    enabled: isAuthenticated,
  });
  const devicesQuery = useQuery({
    queryKey: deviceQueryKeys.devices,
    queryFn: getDevices,
    enabled: isAuthenticated,
  });
  const selectedProductId =
    productId !== null &&
    (productsQuery.data ?? []).some((product) => product.id === productId)
      ? productId
      : null;
  const productDevicesQuery = useQuery({
    queryKey: deviceQueryKeys.productDevices(selectedProductId),
    queryFn: () => getProductDevices(selectedProductId as number),
    enabled: isAuthenticated && selectedProductId !== null,
  });
  const productSummaryQuery = useQuery({
    queryKey: deviceQueryKeys.productSummary(selectedProductId),
    queryFn: () =>
      getProductDeviceManagementSummary(selectedProductId as number),
    enabled: isAuthenticated && selectedProductId !== null,
  });

  const invalidateDeviceQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: deviceQueryKeys.summary }),
      queryClient.invalidateQueries({ queryKey: deviceQueryKeys.products }),
      queryClient.invalidateQueries({ queryKey: deviceQueryKeys.devices }),
      queryClient.invalidateQueries({
        queryKey: deviceQueryKeys.productDevices(selectedProductId),
      }),
      queryClient.invalidateQueries({
        queryKey: deviceQueryKeys.productSummary(selectedProductId),
      }),
    ]);
  };

  return {
    devices: devicesQuery.data ?? [],
    invalidateDeviceQueries,
    isLoading:
      productsQuery.isPending ||
      devicesQuery.isPending ||
      summaryQuery.isPending ||
      productSummaryQuery.isPending,
    productDeviceLinks: productDevicesQuery.data ?? [],
    products: productsQuery.data ?? [],
    productSummary: productSummaryQuery.data ?? null,
    queryError:
      productsQuery.error ??
      devicesQuery.error ??
      summaryQuery.error ??
      productDevicesQuery.error ??
      productSummaryQuery.error,
    summary: summaryQuery.data,
  };
}
