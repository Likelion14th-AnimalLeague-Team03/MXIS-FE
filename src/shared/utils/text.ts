/**
 * 서버가 한 덩어리로 내려주는 설명 문장을 화면에서 항목으로 끊어 보여주기 위한 유틸.
 * 줄바꿈을 먼저 끊고, 마침표·물음표·느낌표 뒤에서 문장을 나눠요.
 * "23.5" 처럼 숫자 사이의 점은 뒤에 공백이 없어서 그대로 유지됩니다.
 */
export function splitSentences(text?: string | null): string[] {
  if (!text) {
    return [];
  }

  return text
    .split(/\r?\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}
