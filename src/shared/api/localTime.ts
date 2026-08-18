/**
 * OpenAPI: LocalTime — 서버가 시간을 문자열이 아닌 객체로 주고받아요.
 * 예: { hour: 14, minute: 30, second: 0, nano: 0 }
 */
export type LocalTime = {
  hour: number;
  minute: number;
  second?: number;
  nano?: number;
};

/** LocalTime -> "14:30" */
export function formatLocalTime(time: LocalTime | null | undefined) {
  if (!time) {
    return null;
  }

  return `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`;
}

/** "14:30" -> LocalTime */
export function toLocalTime(time: string): LocalTime {
  const [hour, minute] = time.split(":");

  return {
    hour: Number(hour),
    minute: Number(minute ?? 0),
    second: 0,
    nano: 0,
  };
}

/** "2026-08-18" -> Date (로컬 자정 기준) */
export function parseLocalDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

/** Date -> "2026-08-18" (서버 format: date) */
export function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
