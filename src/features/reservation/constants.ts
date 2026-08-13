import type { ReservationStore } from "@/features/reservation/types";

export const RESERVATION_STORES: ReservationStore[] = [
  {
    id: "gangnam-shinsegae",
    name: "MCM 신세계 강남점",
    address: "서울 서초구 신반포로 176",
    distanceKm: 2.1
  },
  {
    id: "haus-seoul",
    name: "MCM HAUS 서울",
    address: "서울 중구 명동길 412",
    distanceKm: 2.1
  },
  {
    id: "lotte-main",
    name: "MCM 롯데백화점 본점",
    address: "서울 중구 남대문로 81",
    distanceKm: 2.1
  }
];

export const RESERVATION_TIME_SLOTS = [
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00"
];

export const RESERVATION_WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export const RESERVATION_UNAVAILABLE_TIMES = ["12:00", "15:30", "18:00"];
