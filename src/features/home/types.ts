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
  /** Charm 재연동이 필요한 상태 — 서버가 headline 문구와 별개로 내려줍니다. */
  charmNeedsReconnect?: boolean | null;
};
