import type {
  AvailableTimes,
  Reservation,
  ReservationCancelResult,
  ReservationCreateRequest,
  ReservationStatus,
  ReservationSummary,
  ReservationUpdateRequest,
  Store,
} from "@/features/reservation/types";
import {
  type ApiResponse,
  unwrapApiData,
  unwrapNullableApiData,
  withApiError,
} from "@/shared/api/apiResponse";
import { apiClient } from "@/shared/api/client";

/** GET /stores — 좌표를 주면 distanceKm이 함께 내려와요. */
export async function getStores(params?: { lat?: number; lng?: number }) {
  return withApiError(async () => {
    const response = await apiClient.get<ApiResponse<Store[]>>("/stores", {
      params,
    });

    return (
      unwrapNullableApiData(response.data, "매장 목록을 불러오지 못했습니다.") ?? []
    );
  }, "매장 목록을 불러오는 데 실패했습니다.");
}

/** GET /stores/{id}/available-times?date=YYYY-MM-DD */
export async function getAvailableTimes(storeId: number, date: string) {
  return withApiError(async () => {
    const response = await apiClient.get<ApiResponse<AvailableTimes>>(
      `/stores/${storeId}/available-times`,
      { params: { date } },
    );

    return unwrapApiData(response.data, "예약 가능 시간을 불러오지 못했습니다.");
  }, "예약 가능 시간을 불러오는 데 실패했습니다.");
}

/** GET /reservations */
export async function getReservations(status?: ReservationStatus) {
  return withApiError(async () => {
    const response = await apiClient.get<ApiResponse<ReservationSummary[]>>(
      "/reservations",
      { params: status ? { status } : undefined },
    );

    return (
      unwrapNullableApiData(response.data, "예약 내역을 불러오지 못했습니다.") ?? []
    );
  }, "예약 내역을 불러오는 데 실패했습니다.");
}

/** GET /reservations/{id} */
export async function getReservation(id: number) {
  return withApiError(async () => {
    const response = await apiClient.get<ApiResponse<Reservation>>(
      `/reservations/${id}`,
    );

    return unwrapApiData(response.data, "예약 정보를 불러오지 못했습니다.");
  }, "예약 정보를 불러오는 데 실패했습니다.");
}

/** POST /reservations */
export async function createReservation(request: ReservationCreateRequest) {
  return withApiError(async () => {
    const response = await apiClient.post<ApiResponse<Reservation>>(
      "/reservations",
      request,
    );

    return unwrapApiData(response.data, "예약 요청에 실패했습니다.");
  }, "예약을 요청하는 데 실패했습니다.");
}

/** PATCH /reservations/{id} */
export async function updateReservation(
  id: number,
  request: ReservationUpdateRequest,
) {
  return withApiError(async () => {
    const response = await apiClient.patch<ApiResponse<Reservation>>(
      `/reservations/${id}`,
      request,
    );

    return unwrapApiData(response.data, "예약 변경에 실패했습니다.");
  }, "예약을 변경하는 데 실패했습니다.");
}

/** DELETE /reservations/{id} */
export async function cancelReservation(id: number) {
  return withApiError(async () => {
    const response = await apiClient.delete<ApiResponse<ReservationCancelResult>>(
      `/reservations/${id}`,
    );

    return unwrapApiData(response.data, "예약 취소에 실패했습니다.");
  }, "예약을 취소하는 데 실패했습니다.");
}
