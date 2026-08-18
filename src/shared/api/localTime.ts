/**
 * 서버의 java.time.LocalTime 표현.
 *
 * OpenAPI 문서에는 { hour, minute, second, nano } 객체로 나오지만, 실제 Jackson(JSR-310)은
 * "14:00:00" 문자열로 주고받습니다. 문서와 실제가 달라서 두 형태 모두 받아들이고,
 * 보낼 때는 문자열로 보냅니다.
 */
export type LocalTimeObject = {
  hour: number;
  minute: number;
  second?: number;
  nano?: number;
};

/** 응답에서 시간 필드가 올 수 있는 모든 형태 */
export type LocalTimeLike = string | LocalTimeObject;

/** LocalTime(문자열 또는 객체) -> "14:30" */
export function formatLocalTime(time: LocalTimeLike | null | undefined) {
  if (time == null) {
    return null;
  }

  if (typeof time === "string") {
    // "14:30", "14:30:00", "14:30:00.000" 모두 앞 5자리가 시:분이에요.
    const normalized = time.slice(0, 5);
    return /^\d{2}:\d{2}$/.test(normalized) ? normalized : null;
  }

  if (typeof time.hour !== "number" || typeof time.minute !== "number") {
    return null;
  }

  return `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`;
}

/** "14:30" -> "14:30:00" (요청 본문에 넣는 형식) */
export function toLocalTimeString(time: string) {
  const [hour, minute] = time.split(":");

  return `${String(Number(hour)).padStart(2, "0")}:${String(Number(minute ?? 0)).padStart(2, "0")}:00`;
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
