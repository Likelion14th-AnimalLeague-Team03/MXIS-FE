import type { LocalTimeLike } from "@/shared/api/localTime";

/** OpenAPI: UpcomingReservation */
export type UpcomingReservation = {
  reservationId: number;
  dDay: number;
  reservedDate: string;
  reservedTime: LocalTimeLike;
  storeName?: string | null;
};

export type ProductState = "COLLECTING" | "NEEDS_UPDATE" | "NORMAL";

/** OpenAPI: HomeResponse */
export type HomeSummary = {
  userName?: string | null;
  productImageUrl?: string | null;
  productState: ProductState;
  score?: number | null;
  headline?: string | null;
  daysTogether?: number | null;
  upcomingReservation?: UpcomingReservation | null;
};
