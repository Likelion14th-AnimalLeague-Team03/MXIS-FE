import type {
  Device,
  DeviceManagementSummary,
  ProductDeviceLink,
  ProductDeviceManagementSummary,
} from "@/features/device/types";
import type { Product } from "@/features/product/types";
import {
  type ApiResponse,
  unwrapApiData,
  unwrapNullableApiData,
  withApiError,
} from "@/shared/api/apiResponse";
import { apiClient } from "@/shared/api/client";

export async function getDeviceManagementSummary() {
  return withApiError(async () => {
    const response = await apiClient.get<ApiResponse<DeviceManagementSummary>>(
      "/device-management/summary",
    );

    return unwrapApiData(response.data, "기기 관리 정보를 불러오지 못했습니다.");
  }, "기기 관리 정보를 불러오지 못했습니다.");
}

export async function getProductDeviceManagementSummary(productId: number) {
  return withApiError(async () => {
    const response = await apiClient.get<
      ApiResponse<ProductDeviceManagementSummary>
    >(`/device-management/products/${productId}/summary`);

    return unwrapApiData(response.data, "제품별 기기 관리 정보를 불러오지 못했습니다.");
  }, "제품별 기기 관리 정보를 불러오지 못했습니다.");
}

export async function getProducts() {
  return withApiError(async () => {
    const response = await apiClient.get<ApiResponse<Product[]>>("/products");

    return unwrapNullableApiData(response.data, "제품 목록을 불러오지 못했습니다.") ?? [];
  }, "제품 목록을 불러오지 못했습니다.");
}

export async function setPrimaryProduct(productId: number) {
  return withApiError(async () => {
    const response = await apiClient.patch<ApiResponse<Product>>(
      `/products/${productId}/primary`,
    );

    return unwrapApiData(response.data, "메인 가방 지정에 실패했습니다.");
  }, "메인 가방 지정에 실패했습니다.");
}

export async function getDevices() {
  return withApiError(async () => {
    const response = await apiClient.get<ApiResponse<Device[]>>("/devices");

    return unwrapNullableApiData(response.data, "참 목록을 불러오지 못했습니다.") ?? [];
  }, "참 목록을 불러오지 못했습니다.");
}

export async function getProductDevices(productId: number) {
  return withApiError(async () => {
    const response = await apiClient.get<ApiResponse<ProductDeviceLink[]>>(
      `/products/${productId}/devices`,
    );

    return (
      unwrapNullableApiData(response.data, "연결된 참 목록을 불러오지 못했습니다.") ??
      []
    );
  }, "연결된 참 목록을 불러오지 못했습니다.");
}

export async function connectProductDevice({
  productId,
  deviceId,
  role,
}: {
  productId: number;
  deviceId: number;
  role: "PRIMARY_SENSOR" | "SECONDARY";
}) {
  return withApiError(async () => {
    const response = await apiClient.post<ApiResponse<ProductDeviceLink>>(
      `/products/${productId}/devices`,
      { deviceId, role },
    );

    return unwrapApiData(response.data, "참 연결에 실패했습니다.");
  }, "참 연결에 실패했습니다.");
}

export async function promoteProductDevice({
  productId,
  deviceId,
}: {
  productId: number;
  deviceId: number;
}) {
  return withApiError(async () => {
    const response = await apiClient.patch<ApiResponse<ProductDeviceLink>>(
      `/products/${productId}/devices/${deviceId}`,
    );

    return unwrapApiData(response.data, "대표 참 변경에 실패했습니다.");
  }, "대표 참 변경에 실패했습니다.");
}

export async function disconnectProductDevice({
  productId,
  deviceId,
}: {
  productId: number;
  deviceId: number;
}) {
  return withApiError(async () => {
    await apiClient.delete(`/products/${productId}/devices/${deviceId}`);
  }, "참 연결 해제에 실패했습니다.");
}

export async function deleteDevice(deviceId: number) {
  return withApiError(async () => {
    await apiClient.delete(`/devices/${deviceId}`);
  }, "참 삭제에 실패했습니다.");
}
