import { Pressable, Text, View } from "react-native";

import { CARE_CARD_SHADOW } from "@/features/care/styles";
import { Card } from "@/shared/components/Card";
import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";
import { SentenceList } from "@/shared/components/SentenceList";

/** 원형 버튼 배경 — 시안의 베이지 톤 */
const CIRCLE_BG = "#E9D3BD";

export function CareConditionSummary({
  description,
  onOpenReport,
  summary,
}: {
  description?: string | null;
  onOpenReport: () => void;
  summary?: string | null;
}) {
  return (
    <Card
      className="mt-4 flex-row items-center gap-3 border-concierge-primary bg-white px-4 py-4"
      style={[CARE_CARD_SHADOW, { borderWidth: 1.5 }]}
    >
      <View className="min-w-0 flex-1">
        <Text className="text-xs text-concierge-textMuted">현재 컨디션</Text>
        <Text className="mt-1 text-lg font-bold text-concierge-text">
          {summary ?? "데이터가 수집되고 있습니다."}
        </Text>
        <SentenceList
          className="mt-1"
          text={description}
          fallback="정확한 진단을 위해 환경 데이터를 모으고 있어요."
          textClassName="text-[11px] text-concierge-textMuted"
        />
      </View>

      <Pressable
        onPress={onOpenReport}
        accessibilityRole="button"
        accessibilityLabel="상태 리포트 보기"
        hitSlop={8}
        className="size-14 items-center justify-center rounded-full"
        style={{ backgroundColor: CIRCLE_BG }}
      >
        <ChevronRightIcon size={11} />
      </Pressable>
    </Card>
  );
}
