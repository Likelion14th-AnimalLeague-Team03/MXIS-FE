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

export type SensorReadingUploadItem = {
  sequence: number;
  measuredAt: number;
  temperature: number;
  humidity: number;
  maxShock: number;
  motionCount: number;
};

type SensorReadingBatchRequestItem = {
  sequenceNumber: number;
  temperature: number;
  humidity: number;
  maxShockLevel: number;
  motionCount: number;
  isOuting: boolean;
  measuredAt: string;
};

export type SensorReadingBatchUploadResponse = {
  ackSequence?: number | null;
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

function getDebugTokenLabel(accessToken: string, tokenType = "Bearer") {
  if (!accessToken) return "missing";

  return `${tokenType} ${accessToken.slice(0, 12)}...`;
}

function logApiDebugError(
  label: string,
  error: unknown,
  request?: unknown,
) {
  if (error instanceof AxiosError) {
    console.error(`[Charm API] ${label} failed`, {
      status: error.response?.status,
      response: error.response?.data,
      request,
      message: error.message,
    });
    return;
  }

  console.error(`[Charm API] ${label} failed`, {
    request,
    error,
  });
}

function isBrokenMessage(message: string) {
  return message.includes("???") || message.includes("�") || message.includes("占");
}

function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as ApiResponse<unknown> | undefined;
    const message = responseData?.error?.message;

    return message && !isBrokenMessage(message) ? message : fallbackMessage;
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

function formatLocalDateTimeFromUnixSeconds(unixSeconds: number) {
  const date = new Date(unixSeconds * 1000);
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-")
    + "T"
    + [
      pad(date.getHours()),
      pad(date.getMinutes()),
      pad(date.getSeconds()),
    ].join(":");
}

function toSensorReadingBatchRequestItem(
  reading: SensorReadingUploadItem,
): SensorReadingBatchRequestItem {
  return {
    sequenceNumber: reading.sequence,
    temperature: reading.temperature,
    humidity: reading.humidity,
    maxShockLevel: reading.maxShock,
    motionCount: reading.motionCount,
    isOuting: false,
    measuredAt: formatLocalDateTimeFromUnixSeconds(reading.measuredAt),
  };
}

export async function getConnectionPolicy() {
  try {
    const response = await apiClient.get<ApiResponse<ConnectionPolicyResponse>>(
      "/devices/connection-policy",
    );

    return unwrapApiData(response.data, "BLE ?곌껐 ?뺤콉??遺덈윭?ㅼ? 紐삵뻽?듬땲??");
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "BLE ?곌껐 ?뺤콉??遺덈윭?ㅼ? 紐삵뻽?듬땲??"),
    );
  }
}

export async function registerDevice(
  request: RegisterDeviceRequest,
  accessToken: string,
  tokenType?: string,
) {
  console.log("[Charm API] POST /devices request", {
    request,
    authorization: getDebugTokenLabel(accessToken, tokenType),
  });

  try {
    const response = await apiClient.post<ApiResponse<DeviceResponse>>(
      "/devices",
      request,
      {
        headers: getAuthorizationHeader(accessToken, tokenType),
      },
    );

    console.log("[Charm API] POST /devices response", response.data);

    return unwrapApiData(response.data, "MXIS Charm ?깅줉???ㅽ뙣?덉뒿?덈떎.");
  } catch (error) {
    logApiDebugError("POST /devices", error, request);
    throw new Error(getApiErrorMessage(error, "MXIS Charm ?깅줉???ㅽ뙣?덉뒿?덈떎."));
  }
}

export async function getDevices(accessToken: string, tokenType?: string) {
  console.log("[Charm API] GET /devices request", {
    authorization: getDebugTokenLabel(accessToken, tokenType),
  });

  try {
    const response = await apiClient.get<ApiResponse<DeviceResponse[]>>(
      "/devices",
      {
        headers: getAuthorizationHeader(accessToken, tokenType),
      },
    );

    console.log("[Charm API] GET /devices response", response.data);

    return unwrapApiData(response.data, "湲곌린 紐⑸줉??遺덈윭?ㅼ? 紐삵뻽?듬땲??") ?? [];
  } catch (error) {
    logApiDebugError("GET /devices", error);
    throw new Error(getApiErrorMessage(error, "湲곌린 紐⑸줉??遺덈윭?ㅼ? 紐삵뻽?듬땲??"));
  }
}

export async function getOnboardingProducts(
  accessToken: string,
  tokenType?: string,
) {
  try {
    const response = await apiClient.get<ApiResponse<OnboardingProductResponse[]>>(
      "/onboarding/products",
      {
        headers: getAuthorizationHeader(accessToken, tokenType),
      },
    );

    return unwrapApiData(response.data, "?쒗뭹 紐⑸줉??遺덈윭?ㅼ? 紐삵뻽?듬땲??") ?? [];
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "?쒗뭹 紐⑸줉??遺덈윭?ㅼ? 紐삵뻽?듬땲??"));
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
      `/products/${productId}/devices`,
      {
        deviceId,
        role: "PRIMARY_SENSOR",
      },
      {
        headers: getAuthorizationHeader(accessToken, tokenType),
      },
    );

    return unwrapApiData(response.data, "?쒗뭹怨?MXIS Charm ?곌껐???ㅽ뙣?덉뒿?덈떎.");
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "?쒗뭹怨?MXIS Charm ?곌껐???ㅽ뙣?덉뒿?덈떎."),
    );
  }
}

export async function uploadSensorReadings(
  backendDeviceId: number,
  readings: SensorReadingUploadItem[],
  accessToken: string,
  tokenType?: string,
) {
  const validReadings = readings.filter((reading) => reading.measuredAt > 0);

  if (!validReadings.length) {
    console.log("[Charm API] POST sensor-readings/batch skipped", {
      backendDeviceId,
      reason: "No readings with measuredAt greater than 0.",
      originalCount: readings.length,
    });

    return { ackSequence: null };
  }

  const request = {
    readings: validReadings.map(toSensorReadingBatchRequestItem),
  };

  console.log("[Charm API] POST sensor-readings/batch request", {
    url: `/devices/${backendDeviceId}/sensor-readings/batch`,
    request,
  });

  try {
    const response = await apiClient.post<
      ApiResponse<SensorReadingBatchUploadResponse>
    >(
      `/devices/${backendDeviceId}/sensor-readings/batch`,
      request,
      {
        headers: getAuthorizationHeader(accessToken, tokenType),
      },
    );

    console.log("[Charm API] POST sensor-readings/batch response", response.data);

    return unwrapApiData(response.data, "?쇱꽌 ?곗씠???낅줈?쒖뿉 ?ㅽ뙣?덉뒿?덈떎.");
  } catch (error) {
    logApiDebugError("POST sensor-readings/batch", error, {
      backendDeviceId,
      request,
    });
    throw new Error(getApiErrorMessage(error, "?쇱꽌 ?곗씠???낅줈?쒖뿉 ?ㅽ뙣?덉뒿?덈떎."));
  }
}


