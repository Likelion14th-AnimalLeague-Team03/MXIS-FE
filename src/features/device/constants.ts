export const NOTIFICATION_SETTINGS = [
  { key: "careTiming", label: "케어 시점 알림", defaultValue: true },
  { key: "reservationReminder", label: "예약 리마인드", defaultValue: false },
  { key: "charmConnectionBattery", label: "MXIS Charm 연결·배터리 안내", defaultValue: false },
  { key: "environmentChange", label: "환경 변화 감지", defaultValue: false }
] as const;
