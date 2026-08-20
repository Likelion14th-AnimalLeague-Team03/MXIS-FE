import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/authStore";
import {
  cancelReservation,
  createReservation,
  getAvailableTimes,
  getReservation,
  getReservations,
  getStores,
  updateReservation,
} from "@/features/reservation/api/reservationApi";
import type {
  ReservationCreateRequest,
  ReservationStatus,
  ReservationSummary,
  ReservationType,
  ReservationUpdateRequest,
} from "@/features/reservation/types";

export const reservationQueryKeys = {
  stores: (lat?: number, lng?: number) => ["stores", lat ?? null, lng ?? null] as const,
  availableTimes: (storeId: number | null, date: string | null) =>
    ["stores", storeId, "available-times", date] as const,
  list: (status?: ReservationStatus) => ["reservations", status ?? "ALL"] as const,
  detail: (id: number | null) => ["reservations", id] as const,
};

/** 진행 중으로 볼 상태 — 취소·완료된 예약은 예약 현황에서 제외해요. */
const ACTIVE_STATUSES: ReservationStatus[] = ["PENDING_APPROVAL", "CONFIRMED"];

export function useStores(params?: { lat?: number; lng?: number }) {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: reservationQueryKeys.stores(params?.lat, params?.lng),
    queryFn: () => getStores(params),
    enabled: Boolean(accessToken),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAvailableTimes(storeId: number | null, date: string | null) {
  return useQuery({
    queryKey: reservationQueryKeys.availableTimes(storeId, date),
    queryFn: () => getAvailableTimes(storeId as number, date as string),
    enabled: storeId !== null && date !== null,
  });
}

export function useReservations(status?: ReservationStatus) {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: reservationQueryKeys.list(status),
    queryFn: () => getReservations(status),
    enabled: Boolean(accessToken),
  });
}

/**
 * 진행 중인 예약을 종류별로 나눠서 돌려줘요.
 * 컨시어지(유상)와 무상 케어는 각각 1건씩 가질 수 있어서, 둘 다 있으면 카드도 둘 다 보여줍니다.
 */
export function useActiveReservations(productId?: number | null) {
  const query = useReservations();

  const active = ((query.data ?? []) as ReservationSummary[])
    .filter((item) => ACTIVE_STATUSES.includes(item.status))
    .filter((item) => (productId == null ? true : item.productId === productId))
    .sort((a, b) => a.reservedDate.localeCompare(b.reservedDate));

  const findByType = (type: ReservationType) =>
    active.find((item) => item.reservationType === type) ?? null;

  return {
    ...query,
    activeReservations: active,
    /** 케어 컨시어지(유상) 예약 */
    paidReservation: findByType("PAID"),
    /** 무상 케어 예약 */
    freeReservation: findByType("FREE"),
  };
}

/**
 * 예약 현황 카드에 쓸 "가장 가까운 진행 중 예약".
 * productId를 주면 그 제품(메인으로 선택한 가방)의 예약만 봅니다.
 */
export function useActiveReservation(productId?: number | null) {
  const { activeReservations, ...rest } = useActiveReservations(productId);

  return { ...rest, activeReservation: activeReservations.at(0) ?? null };
}

export function useReservation(id: number | null) {
  return useQuery({
    queryKey: reservationQueryKeys.detail(id),
    queryFn: () => getReservation(id as number),
    enabled: id !== null,
  });
}

function useInvalidateReservations() {
  const queryClient = useQueryClient();

  return async (id?: number) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["reservations"] }),
      // 홈 화면의 "다가오는 예약" 카드도 같이 갱신해요.
      queryClient.invalidateQueries({ queryKey: ["home"] }),
      id != null
        ? queryClient.invalidateQueries({
            queryKey: reservationQueryKeys.detail(id),
          })
        : Promise.resolve(),
    ]);
  };
}

export function useCreateReservation() {
  const invalidate = useInvalidateReservations();

  return useMutation({
    mutationFn: (request: ReservationCreateRequest) => createReservation(request),
    onSuccess: async (reservation) => {
      await invalidate(reservation.id);
    },
  });
}

export function useUpdateReservation() {
  const invalidate = useInvalidateReservations();

  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: ReservationUpdateRequest }) =>
      updateReservation(id, request),
    onSuccess: async (reservation) => {
      await invalidate(reservation.id);
    },
  });
}

export function useCancelReservation() {
  const invalidate = useInvalidateReservations();

  return useMutation({
    mutationFn: (id: number) => cancelReservation(id),
    onSuccess: async (result) => {
      await invalidate(result.id);
    },
  });
}
