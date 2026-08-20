import type { LocalTimeLike } from "@/shared/api/localTime";

/** OpenAPI: StoreResponse */
export type Store = {
  id: number;
  storeName: string;
  address?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  openingHours?: string | null;
  /** 매장 상세(웹) 링크 — "매장 자세히 보기"에서 외부 브라우저로 열어요. */
  storeUrl?: string | null;
  distanceKm?: number | null;
};

/** OpenAPI: TimeSlot */
export type TimeSlot = {
  /** "14:00" 또는 "14:00:00" 형태로 내려와요. */
  time: string;
  available: boolean;
};

/** OpenAPI: AvailableTimesResponse */
export type AvailableTimes = {
  storeId: number;
  date: string;
  slots?: TimeSlot[] | null;
};

export type ReservationType = "FREE" | "PAID";

export type ReservationStatus =
  | "PENDING_APPROVAL"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

/** OpenAPI: ReservationResponse */
export type Reservation = {
  id: number;
  productId: number;
  productName?: string | null;
  storeId: number;
  storeName?: string | null;
  storeAddress?: string | null;
  storePhone?: string | null;
  /** 매장 상세(웹) 링크 */
  storeUrl?: string | null;
  careSuggestionId?: number | null;
  serviceType?: string | null;
  reservationType: ReservationType;
  reservedDate: string;
  reservedTime: LocalTimeLike;
  customerNote?: string | null;
  status: ReservationStatus;
  cancelledAt?: string | null;
  completedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

/** OpenAPI: ReservationSummaryResponse */
export type ReservationSummary = {
  id: number;
  productId: number;
  productName?: string | null;
  storeId: number;
  storeName?: string | null;
  storeAddress?: string | null;
  reservationType: ReservationType;
  reservedDate: string;
  reservedTime: LocalTimeLike;
  status: ReservationStatus;
};

/** OpenAPI: ReservationCreateRequest */
export type ReservationCreateRequest = {
  productId: number;
  storeId: number;
  careSuggestionId?: number;
  serviceType?: string;
  reservationType: ReservationType;
  reservedDate: string;
  /** "14:00:00" — 서버 Jackson이 LocalTime을 문자열로 받습니다. */
  reservedTime: string;
  customerNote?: string;
};

/** OpenAPI: ReservationUpdateRequest */
export type ReservationUpdateRequest = {
  reservedDate?: string;
  /** "14:00:00" */
  reservedTime?: string;
  customerNote?: string;
};

/** OpenAPI: ReservationCancelResponse */
export type ReservationCancelResult = {
  id: number;
  status: ReservationStatus;
  cancelledAt?: string | null;
};

/** 예약 입력 화면에서 모아두는 값 — 서버에 보내기 전 단계예요. */
export type ReservationDraft = {
  storeId: number | null;
  storeName: string | null;
  storeAddress: string | null;
  date: Date | null;
  /** "14:00" */
  time: string | null;
  note: string;
};
