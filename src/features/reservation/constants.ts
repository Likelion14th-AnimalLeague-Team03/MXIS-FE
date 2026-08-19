import type {
  ReservationStatus,
  ReservationType,
} from "@/features/reservation/types";

export const RESERVATION_WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
  PENDING_APPROVAL: "승인 대기중",
  CONFIRMED: "예약 확정",
  CANCELLED: "예약 취소",
  COMPLETED: "케어 완료",
};

/** 예약 종류 라벨 — 컨시어지(유상)와 무상 케어 카드를 구분해서 보여줄 때 씁니다. */
export const RESERVATION_TYPE_LABEL: Record<ReservationType, string> = {
  PAID: "케어 컨시어지",
  FREE: "무상 케어",
};

/** 예약 시 함께 보내는 기본 서비스명 (ReservationCreateRequest.serviceType) */
export const DEFAULT_SERVICE_TYPE = "제품 컨디션 점검";
