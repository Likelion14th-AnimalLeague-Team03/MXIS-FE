import type { ConsentType, NotificationSetting } from "@/features/mypage/types";

export const NOTIFICATION_ITEMS: {
  key: keyof Pick<
    NotificationSetting,
    | "careTimingEnabled"
    | "reservationEnabled"
    | "deviceStatusEnabled"
    | "environmentAlertEnabled"
    | "marketingEnabled"
  >;
  label: string;
}[] = [
  { key: "careTimingEnabled", label: "케어 시점 알림" },
  { key: "reservationEnabled", label: "예약 리마인드" },
  { key: "deviceStatusEnabled", label: "MXIS Charm 연결·배터리 안내" },
  { key: "environmentAlertEnabled", label: "환경 변화 감지" },
  { key: "marketingEnabled", label: "브랜드 소식·마케팅 알림" },
];

export const DEFAULT_TERMS_VERSION = "1.0";

export const CONSENT_LABELS: Record<ConsentType, string> = {
  TERMS_OF_SERVICE: "서비스 이용약관",
  PRIVACY: "개인정보 수집·이용 약관",
  SENSOR_DATA: "센서 데이터 수집 약관",
  MARKETING: "브랜드 소식 및 마케팅 알림 약관",
};
