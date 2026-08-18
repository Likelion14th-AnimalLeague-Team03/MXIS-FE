import type { ReservationStatus } from "@/features/reservation/types";

export const RESERVATION_WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
  PENDING_APPROVAL: "승인 대기중",
  CONFIRMED: "예약 확정",
  CANCELLED: "예약 취소",
  COMPLETED: "케어 완료",
};

/** 예약 시 함께 보내는 기본 서비스명 (ReservationCreateRequest.serviceType) */
export const DEFAULT_SERVICE_TYPE = "제품 컨디션 점검";
