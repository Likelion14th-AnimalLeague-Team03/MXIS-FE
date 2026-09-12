import { AxiosError } from "axios";

import type { Device, ProductDeviceLink } from "@/features/device/types";
import type { ApiResponse } from "@/shared/api/apiResponse";
import { apiClient } from "@/shared/api/client";
import { logCharmDebug } from "../utils/charmLogger";

export type ConnectionPolicyResponse = {
  allowedServiceUuids: string[];
  scanTimeoutSeconds: number;
  connectTimeoutSeconds: number;
};

export type DeviceResponse = Device;

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

export type ProductDeviceLinkResponse = ProductDeviceLink;

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

  return `${tokenType} present`;
}

function logApiDebugError(
  label: string,
  error: unknown,
  request?: unknown,
  level: "error" | "warn" = "error",
) {
  const log = level === "warn" ? console.warn : console.error;

  if (error instanceof AxiosError) {
    log(`[Charm API] ${label} failed`, {
      status: error.response?.status,
      response: error.response?.data,
      request,
      message: error.message,
    });
    return;
  }

  log(`[Charm API] ${label} failed`, {
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

    if (message && !isBrokenMessage(message)) return message;
    return error.response
      ? `${fallbackMessage} (HTTP ${error.response.status})`
      : `${fallbackMessage} (서버 응답 없음: ${error.code ?? "네트워크 확인"})`;
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
    measuredAt: formatLocalDateTimeFromUnixSeconds(reading.measuredAt),
  };
}

export async function getConnectionPolicy() {
  try {
    const response = await apiClient.get<ApiResponse<ConnectionPolicyResponse>>(
      "/devices/connection-policy",
    );

    return unwrapApiData(response.data, "BLE 연결 정책을 불러오지 못했습니다.");
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "BLE 연결 정책을 불러오지 못했습니다."),
    );
  }
}

export async function registerDevice(
  request: RegisterDeviceRequest,
  accessToken: string,
  tokenType?: string,
) {
  logCharmDebug("[Charm API] POST /devices request", {
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

    logCharmDebug("[Charm API] POST /devices response", response.data);

    return unwrapApiData(response.data, "MXIS Charm 등록에 실패했습니다.");
  } catch (error) {
    logApiDebugError("POST /devices", error, request);
    throw new Error(getApiErrorMessage(error, "MXIS Charm 등록에 실패했습니다."));
  }
}

export async function getDevices(accessToken: string, tokenType?: string) {
  logCharmDebug("[Charm API] GET /devices request", {
    authorization: getDebugTokenLabel(accessToken, tokenType),
  });

  try {
    const response = await apiClient.get<ApiResponse<DeviceResponse[]>>(
      "/devices",
      {
        headers: getAuthorizationHeader(accessToken, tokenType),
      },
    );

    logCharmDebug("[Charm API] GET /devices response", response.data);

    return unwrapApiData(response.data, "기기 목록을 불러오지 못했습니다.") ?? [];
  } catch (error) {
    logApiDebugError("GET /devices", error);
    throw new Error(getApiErrorMessage(error, "기기 목록을 불러오지 못했습니다."));
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

    return unwrapApiData(response.data, "제품과 MXIS Charm 연결에 실패했습니다.");
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "제품과 MXIS Charm 연결에 실패했습니다."),
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
    logCharmDebug("[Charm API] POST sensor-readings/batch skipped", {
      backendDeviceId,
      reason: "No readings with measuredAt greater than 0.",
      originalCount: readings.length,
    });

    return { ackSequence: null };
  }

  const request = {
    readings: validReadings.map(toSensorReadingBatchRequestItem),
  };

  logCharmDebug("[Charm API] POST sensor-readings/batch request", {
    url: `/devices/${backendDeviceId}/sensor-readings/batch`,
    request,
  });

  try {
    const response = await apiClient.post<ApiResponse<SensorReadingBatchUploadResponse> | SensorReadingBatchUploadResponse | null>(
      `/devices/${backendDeviceId}/sensor-readings/batch`,
      request,
      {
        headers: getAuthorizationHeader(accessToken, tokenType),
      },
    );

    logCharmDebug("[Charm API] POST sensor-readings/batch response", response.data);

    const body = response.data;
    if (body == null || (body as unknown) === "") return { ackSequence: null };
    if (typeof body !== "object" || Array.isArray(body)) throw new Error("서버 응답 형식을 확인할 수 없습니다.");
    const data = "success" in body
      ? (body.success && body.data == null ? { ackSequence: null } : unwrapApiData(body, "센서 데이터 업로드에 실패했습니다."))
      : body;
    if (data.ackSequence != null && (!Number.isInteger(data.ackSequence) || data.ackSequence < 0 || data.ackSequence > 0xffffffff)) {
      throw new Error("서버 ACK 번호가 잘못되었습니다. 기기 데이터는 삭제하지 않았습니다.");
    }
    return data;
  } catch (error) {
    logApiDebugError("POST sensor-readings/batch", error, {
      backendDeviceId,
      request,
    }, "warn");
    throw new Error(getApiErrorMessage(error, "센서 데이터 서버 업로드에 실패했습니다."));
  }
}
