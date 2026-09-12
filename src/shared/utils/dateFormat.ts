const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

export function formatDateDot(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day} (${WEEKDAYS_KO[date.getDay()]})`;
}

export function formatDateKoreanFull(date: Date) {
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAYS_KO[date.getDay()]}요일`;
}

export function formatDateShort(date: Date) {
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function formatDateTimeMeridiem(date: Date, time: string) {
  const [hourText, minuteText] = time.split(":");
  const hour = Number(hourText);
  const meridiem = hour < 12 ? "오전" : "오후";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day} ${meridiem} ${hour12}:${minuteText}`;
}
