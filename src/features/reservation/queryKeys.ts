import type { ReservationStatus } from "@/features/reservation/types";

export const reservationQueryKeys = {
  all: ["reservations"] as const,
  stores: (lat?: number, lng?: number) =>
    ["stores", lat ?? null, lng ?? null] as const,
  availableTimes: (storeId: number | null, date: string | null) =>
    ["stores", storeId, "available-times", date] as const,
  list: (status?: ReservationStatus) =>
    ["reservations", status ?? "ALL"] as const,
  detail: (id: number | null) => ["reservations", id] as const,
};
