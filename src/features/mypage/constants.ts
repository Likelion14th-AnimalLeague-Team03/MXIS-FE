import type { ConsentType, NotificationSetting } from "@/features/mypage/types";

export type NotificationSettingKey = keyof Pick<
  NotificationSetting,
  | "careTimingEnabled"
  | "reservationEnabled"
  | "deviceStatusEnabled"
  | "environmentAlertEnabled"
  | "marketingEnabled"
>;

type TermsGroup = { heading: string; content: string };

export type TermsSectionKey = "service" | "privacy" | "sensor" | "marketing";

export type TermsSection = {
  key: TermsSectionKey;
  consentType?: ConsentType;
  label: string;
  meta: string;
  description: string;
  groups: TermsGroup[];
  linkLabel?: string;
  note?: string;
  togglable?: boolean;
};

export type MyPageSectionKey = "info" | "notifications" | TermsSectionKey;

export const EXPANDED_SECTION_BACKGROUND = "#E7E7E7";

export const NOTIFICATION_ITEMS: {
  key: NotificationSettingKey;
  label: string;
}[] = [
  { key: "careTimingEnabled", label: "케어 시점 알림" },
  { key: "reservationEnabled", label: "예약 리마인드" },
  { key: "deviceStatusEnabled", label: "MXIS Charm 연결·배터리 안내" },
  { key: "environmentAlertEnabled", label: "환경 변화 감지" },
  { key: "marketingEnabled", label: "브랜드 소식·마케팅 알림" },
];

export const DEFAULT_TERMS_VERSION = "1.0";

export const TERMS_SECTIONS: TermsSection[] = [
  {
    key: "service",
    consentType: "TERMS_OF_SERVICE",
    label: "서비스 이용약관",
    meta: "시행일 2026.08.01",
    description: "MXIS 서비스 이용 조건과 권리, 의무를 안내합니다.",
    groups: [
      {
        heading: "주요 내용",
        content: "서비스 제공 · Smart Charm 연결 · 케어 정보 · 예약",
      },
    ],
    linkLabel: "서비스 이용약관 전문 보기",
  },
  {
    key: "privacy",
    consentType: "PRIVACY",
    label: "개인정보 수집·이용 약관",
    meta: "시행일 2026.08.01",
    description: "서비스 제공을 위해 아래 정보를 수집·이용합니다.",
    groups: [
      {
        heading: "수집 항목",
        content:
          "이름, 이메일, 전화번호, 제품 정보, Smart Charm 연동 정보, 센서 기록 데이터",
      },
      {
        heading: "이용 목적",
        content: "회원 관리 · 제품 케어 · 예약 및 알림 제공",
      },
    ],
    linkLabel: "개인정보 처리방침 전문 보기",
  },
  {
    key: "sensor",
    consentType: "SENSOR_DATA",
    label: "센서 데이터 수집 약관",
    meta: "시행일 2026.08.01",
    description: "제품 케어 제안을 위해 Smart Charm의 기록 데이터를 활용합니다.",
    groups: [
      { heading: "수집 항목", content: "온습도, 움직임, 충격, 동기화 기록" },
      { heading: "이용 목적", content: "제품 보관 환경 확인 및 케어 시점 제안" },
    ],
    linkLabel: "센서 데이터 수집 약관 전문 보기",
  },
  {
    key: "marketing",
    consentType: "MARKETING",
    label: "브랜드 소식 및 마케팅 알림 약관",
    meta: "선택 동의",
    description: "MCM의 새로운 제품과 브랜드 소식을 받아볼 수 있습니다.",
    groups: [
      {
        heading: "안내 내용",
        content: "시즌 컬렉션 · 브랜드 이벤트 · MXIS 혜택",
      },
      { heading: "수신 방법", content: "앱 푸시 알림" },
    ],
    note: "동의하지 않아도 기본 서비스 이용에는 제한이 없습니다.",
    togglable: true,
  },
];

export const CONSENT_LABELS: Record<ConsentType, string> = {
  TERMS_OF_SERVICE: "서비스 이용약관",
  PRIVACY: "개인정보 수집·이용 약관",
  SENSOR_DATA: "센서 데이터 수집 약관",
  MARKETING: "브랜드 소식 및 마케팅 알림 약관",
};
