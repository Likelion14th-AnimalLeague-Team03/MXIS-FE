import { formatLocalTime, parseLocalDate } from "@/shared/api/localTime";
import type { LocalTime } from "@/shared/api/localTime";

const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

export function formatDateDot(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${d} (${WEEKDAYS_KO[date.getDay()]})`;
}

export function formatDateKoreanFull(date: Date) {
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAYS_KO[date.getDay()]}요일`;
}

export function formatDateShort(date: Date) {
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function formatDateTimeMeridiem(date: Date, time: string) {
  const [hStr, mStr] = time.split(":");
  const hour = Number(hStr);
  const meridiem = hour < 12 ? "오전" : "오후";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${d} ${meridiem} ${hour12}:${mStr}`;
}

/** 서버 슬롯은 "14:00" 또는 "14:00:00"으로 오는데, 화면에는 "14:00"으로 통일해서 써요. */
export function normalizeSlotTime(time: string) {
  return time.slice(0, 5);
}

/** 서버 예약(reservedDate + reservedTime)을 화면용 Date/문자열로 바꿔줘요. */
export function toReservationDateTime(reservedDate: string, reservedTime: LocalTime) {
  return {
    date: parseLocalDate(reservedDate),
    time: formatLocalTime(reservedTime) ?? "",
  };
}
