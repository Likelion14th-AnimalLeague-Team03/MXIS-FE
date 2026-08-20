import type {
  ConsentItem,
  ConsentStatus,
  MyProfile,
  NotificationSetting,
  NotificationSettingUpdate,
} from "@/features/mypage/types";
import {
  type ApiResponse,
  unwrapApiData,
  unwrapNullableApiData,
  withApiError,
} from "@/shared/api/apiResponse";
import { apiClient } from "@/shared/api/client";

/** GET /users/me */
export async function getMyProfile() {
  return withApiError(async () => {
    const response = await apiClient.get<ApiResponse<MyProfile>>("/users/me");

    return unwrapApiData(response.data, "내 정보를 불러오지 못했습니다.");
  }, "내 정보를 불러오는 데 실패했습니다.");
}

/** GET /users/me/notification-settings */
export async function getNotificationSettings() {
  return withApiError(async () => {
    const response = await apiClient.get<ApiResponse<NotificationSetting>>(
      "/users/me/notification-settings",
    );

    return unwrapApiData(response.data, "알림 설정을 불러오지 못했습니다.");
  }, "알림 설정을 불러오는 데 실패했습니다.");
}

/** PATCH /users/me/notification-settings */
export async function updateNotificationSettings(
  request: NotificationSettingUpdate,
) {
  return withApiError(async () => {
    const response = await apiClient.patch<ApiResponse<NotificationSetting>>(
      "/users/me/notification-settings",
      request,
    );

    return unwrapApiData(response.data, "알림 설정을 변경하지 못했습니다.");
  }, "알림 설정을 변경하는 데 실패했습니다.");
}

/** GET /users/me/consents */
export async function getConsents() {
  return withApiError(async () => {
    const response =
      await apiClient.get<ApiResponse<ConsentStatus[]>>("/users/me/consents");

    return (
      unwrapNullableApiData(
        response.data,
        "약관 동의 내역을 불러오지 못했습니다.",
      ) ?? []
    );
  }, "약관 동의 내역을 불러오는 데 실패했습니다.");
}

/** POST /users/me/consents */
export async function updateConsents(consents: ConsentItem[]) {
  return withApiError(async () => {
    const response = await apiClient.post<ApiResponse<ConsentStatus[]>>(
      "/users/me/consents",
      { consents },
    );

    return unwrapApiData(response.data, "약관 동의를 저장하지 못했습니다.");
  }, "약관 동의를 저장하는 데 실패했습니다.");
}
