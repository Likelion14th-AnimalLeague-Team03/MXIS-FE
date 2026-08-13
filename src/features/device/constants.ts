import type { ImageSourcePropType } from "react-native";

import charm1 from "@/features/device/assets/charm1.png";
import charm2 from "@/features/device/assets/charm2.png";
import charm3 from "@/features/device/assets/charm3.png";

export type Charm = {
  id: string;
  label: string;
  image: ImageSourcePropType;
  battery: number;
};

export const DEVICE_CHARMS: Charm[] = [
  { id: "white", label: "white", image: charm1, battery: 65 },
  { id: "black", label: "black", image: charm2, battery: 82 },
  { id: "cognac", label: "cognac", image: charm3, battery: 70 }
];

export const CONNECTED_CHARM_ID = "white";

export const NOTIFICATION_SETTINGS = [
  { key: "careTiming", label: "케어 시점 알림", defaultValue: true },
  { key: "reservationReminder", label: "예약 리마인드", defaultValue: false },
  { key: "charmConnectionBattery", label: "MXIS Charm 연결·배터리 안내", defaultValue: false },
  { key: "environmentChange", label: "환경 변화 감지", defaultValue: false }
] as const;
