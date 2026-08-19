import { Text, View } from "react-native";

import { splitSentences } from "@/shared/utils/text";

type Props = {
  /** 서버에서 온 설명 문장 (여러 문장이 한 덩어리로 올 수 있어요) */
  text?: string | null;
  /** text가 없을 때 보여줄 문구 */
  fallback?: string;
  /** 문장에 적용할 타이포 클래스 — 화면마다 크기·색이 달라서 밖에서 넘겨요. */
  textClassName?: string;
  className?: string;
};

/**
 * 여러 문장을 "· 문장" 형태의 항목으로 끊어 보여줘요.
 * 문장이 하나뿐이면 불릿 없이 그대로 한 줄로 둡니다.
 */
export function SentenceList({
  text,
  fallback,
  textClassName = "text-[13px] text-concierge-textMuted",
  className,
}: Props) {
  const sentences = splitSentences(text);
  const items = sentences.length > 0 ? sentences : fallback ? [fallback] : [];

  if (items.length === 0) {
    return null;
  }

  if (items.length === 1) {
    return (
      <View className={className}>
        <Text className={textClassName}>{items[0]}</Text>
      </View>
    );
  }

  return (
    <View className={`gap-1 ${className ?? ""}`}>
      {items.map((sentence) => (
        <View key={sentence} className="flex-row gap-1.5">
          <Text className={textClassName}>·</Text>
          <Text className={`flex-1 ${textClassName}`}>{sentence}</Text>
        </View>
      ))}
    </View>
  );
}
