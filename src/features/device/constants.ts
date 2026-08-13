import type { ImageSourcePropType } from "react-native";

import bag1 from "@/features/device/assets/bag1.png";
import bag2 from "@/features/device/assets/bag2.png";
import bag3 from "@/features/device/assets/bag3.png";
import charm1 from "@/features/device/assets/charm1.png";
import charm2 from "@/features/device/assets/charm2.png";
import charm3 from "@/features/device/assets/charm3.png";

export type Product = {
  id: string;
  name: string;
  variant: string;
  image: ImageSourcePropType;
};

// 사용자가 등록한 제품 목록 — 상단 원형 선택기와 메인 사진에서 공유해서 써요.
export const PRODUCTS: Product[] = [
  { id: "himmel", name: "MCM Himmel Backpack", variant: "Visetos Canvas · Gray", image: bag1 },
  { id: "liz", name: "MCM Liz Tote", variant: "Visetos Canvas · Beige", image: bag2 },
  { id: "aren", name: "MCM Aren Shopper", variant: "Visetos Canvas · Black", image: bag3 }
];

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
