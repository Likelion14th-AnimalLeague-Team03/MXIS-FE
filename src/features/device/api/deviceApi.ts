import type { Product } from "@/features/product/types";
import {
  type ApiResponse,
  unwrapApiData,
  unwrapNullableApiData,
  withApiError,
} from "@/shared/api/apiResponse";
import { apiClient } from "@/shared/api/client";

export type DeviceConnectionStatus =
  | "CONNECTED"
  | "DISCONNECTED"
  | "SYNCING"
  | "ERROR"
  | string;

export type Device = {
  id: number;
  serialNumber: string;
  deviceName: string;
  macAddress?: string | null;
  firmwareVersion?: string | null;
  deviceImageUrl?: string | null;
  batteryLevel?: number | null;
  connectionStatus: DeviceConnectionStatus;
  lastSyncedAt?: string | null;
  registeredAt: string;
};

export type ProductDeviceLink = {
  id: number;
  deviceId: number;
  serialNumber: string;
  deviceName: string;
  role: "PRIMARY_SENSOR" | "SECONDARY" | string;
  attachedAt: string;
  detachedAt?: string | null;
};

export type DeviceManagementSummary = {
  products: Array<{
    productId: number;
    productImageUrl?: string | null;
  }>;
  primaryProduct: {
    productId: number;
    productImageUrl?: string | null;
    productName: string;
    materialId?: string | null;
    materialDisplayName?: string | null;
    color?: string | null;
    modelCode?: string | null;
    dppCode?: string | null;
  } | null;
  totalOutingCount: number | null;
  primaryDevice: {
    deviceId: number;
    serialNumber: string;
    deviceName?: string | null;
    deviceImageUrl?: string | null;
    connectionStatus?: DeviceConnectionStatus | null;
    batteryLevel?: number | null;
    lastSyncedAt?: string | null;
  } | null;
  currentEnvironment: {
    temperature?: number | null;
    humidity?: number | null;
    measuredAt?: string | null;
  } | null;
};

export type ProductDeviceManagementSummary = {
  product: {
    productId?: number;
    id?: number;
    productImageUrl?: string | null;
    productName: string;
    materialId?: string | null;
    materialDisplayName?: string | null;
    materialName?: string | null;
    color?: string | null;
    modelCode?: string | null;
    dppCode?: string | null;
    productCode?: string | null;
    isPrimary?: boolean;
    primary?: boolean;
  } | null;
  currentEnvironment: {
    temperature?: number | null;
    humidity?: number | null;
    measuredAt?: string | null;
  } | null;
  totalOutingCount: number | null;
  primaryDevice: {
    deviceId: number;
    serialNumber: string;
    deviceName?: string | null;
    deviceImageUrl?: string | null;
    connectionStatus?: DeviceConnectionStatus | null;
    batteryLevel?: number | null;
    lastSyncedAt?: string | null;
  } | null;
  connectedDevices?: Array<{
    deviceId: number;
    serialNumber: string;
    deviceName?: string | null;
    deviceImageUrl?: string | null;
    role?: "PRIMARY_SENSOR" | "SECONDARY" | string;
    connectionStatus?: DeviceConnectionStatus | null;
    batteryLevel?: number | null;
    lastSyncedAt?: string | null;
  }> | null;
  outingCount?: number | string | null;
  totalOutings?: number | string | null;
  totalOutingSessions?: number | string | null;
};

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
