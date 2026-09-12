import { formatLocalTime, parseLocalDate } from "@/shared/api/localTime";
import type { LocalTimeLike } from "@/shared/api/localTime";

/** 서버 슬롯은 "14:00" 또는 "14:00:00"으로 오는데, 화면에는 "14:00"으로 통일해서 써요. */
export function normalizeSlotTime(time: string) {
  return time.slice(0, 5);
}

/** 서버 예약(reservedDate + reservedTime)을 화면용 Date/문자열로 바꿔줘요. */
export function toReservationDateTime(
  reservedDate: string,
  reservedTime: LocalTimeLike,
) {
  return {
    date: parseLocalDate(reservedDate),
    time: formatLocalTime(reservedTime) ?? "",
  };
}
