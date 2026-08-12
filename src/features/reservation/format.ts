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
