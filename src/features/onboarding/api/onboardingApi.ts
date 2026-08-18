import { AxiosError } from "axios";

import { apiClient } from "@/shared/api/client";

type ApiErrorBody = {
  code: string;
  message: string;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T | null;
  error?: ApiErrorBody | null;
};

export type ConnectionPolicyResponse = {
  allowedServiceUuids: string[];
  scanTimeoutSeconds: number;
  connectTimeoutSeconds: number;
};

export type DeviceResponse = {
  id: number;
  serialNumber: string;
  deviceName: string;
  macAddress?: string | null;
  firmwareVersion?: string | null;
  deviceImageUrl?: string | null;
  batteryLevel?: number | null;
  connectionStatus: "CONNECTED" | "DISCONNECTED" | "SYNCING" | "ERROR" | string;
  lastSyncedAt?: string | null;
  registeredAt: string;
};

export type OnboardingProductResponse = {
  productId: number;
  productImageUrl?: string | null;
  productName: string;
  materialId: string;
  materialDisplayName: string;
  color?: string | null;
  modelCode?: string | null;
  dppCode?: string | null;
  isPrimary: boolean;
};

export type ProductDeviceLinkResponse = {
  id: number;
  deviceId: number;
  serialNumber: string;
  deviceName: string;
  role: "PRIMARY_SENSOR" | "SECONDARY" | string;
  attachedAt: string;
  detachedAt?: string | null;
};

type RegisterDeviceRequest = {
  serialNumber: string;
  deviceName?: string;
  macAddress?: string;
  firmwareVersion?: string;
  deviceImageUrl?: string;
};

function getAuthorizationHeader(accessToken: string, tokenType = "Bearer") {
  return {
    Authorization: `${tokenType} ${accessToken}`,
  };
}

function isBrokenMessage(message: string) {
  return message.includes("???") || message.includes("�");
}

function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as ApiResponse<unknown> | undefined;
    const message = responseData?.error?.message;

    if (message && !isBrokenMessage(message)) {
      return message;
    }

    return fallbackMessage;
  }

  if (error instanceof Error) {
    return isBrokenMessage(error.message) ? fallbackMessage : error.message;
  }

  return fallbackMessage;
}

function unwrapApiData<T>(response: ApiResponse<T>, fallbackMessage: string) {
  if (response.success && response.data != null) {
    return response.data;
  }

  const message = response.error?.message;
  throw new Error(message && !isBrokenMessage(message) ? message : fallbackMessage);
}

export async function getConnectionPolicy() {
  try {
    const response = await apiClient.get<ApiResponse<ConnectionPolicyResponse>>(
      "/api/v1/devices/connection-policy",
    );

    return unwrapApiData(response.data, "BLE 연결 정책을 불러오지 못했습니다.");
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "BLE 연결 정책을 불러오지 못했습니다."));
  }
}

export async function registerDevice(
  request: RegisterDeviceRequest,
  accessToken: string,
  tokenType?: string,
) {
  try {
    const response = await apiClient.post<ApiResponse<DeviceResponse>>(
      "/api/v1/devices",
      request,
      {
        headers: getAuthorizationHeader(accessToken, tokenType),
      },
    );

    return unwrapApiData(response.data, "MXIS Charm 등록에 실패했습니다.");
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "MXIS Charm 등록에 실패했습니다."));
  }
}

export async function getDevices(accessToken: string, tokenType?: string) {
  try {
    const response = await apiClient.get<ApiResponse<DeviceResponse[]>>(
      "/api/v1/devices",
      {
        headers: getAuthorizationHeader(accessToken, tokenType),
      },
    );

    return unwrapApiData(response.data, "기기 목록을 불러오지 못했습니다.") ?? [];
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "기기 목록을 불러오지 못했습니다."));
  }
}

export async function getOnboardingProducts(accessToken: string, tokenType?: string) {
  try {
    const response = await apiClient.get<ApiResponse<OnboardingProductResponse[]>>(
      "/api/v1/onboarding/products",
      {
        headers: getAuthorizationHeader(accessToken, tokenType),
      },
    );

    return unwrapApiData(response.data, "제품 목록을 불러오지 못했습니다.") ?? [];
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "제품 목록을 불러오지 못했습니다."));
  }
}

export async function linkProductDevice(
  productId: number,
  deviceId: number,
  accessToken: string,
  tokenType?: string,
) {
  try {
    const response = await apiClient.post<ApiResponse<ProductDeviceLinkResponse>>(
      `/api/v1/products/${productId}/devices`,
      {
        deviceId,
        role: "PRIMARY_SENSOR",
      },
      {
        headers: getAuthorizationHeader(accessToken, tokenType),
      },
    );

    return unwrapApiData(response.data, "제품과 MXIS Charm 연결에 실패했습니다.");
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "제품과 MXIS Charm 연결에 실패했습니다."));
  }
}
