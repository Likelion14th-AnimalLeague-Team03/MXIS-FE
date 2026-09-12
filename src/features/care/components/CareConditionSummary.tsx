import { Pressable, Text } from "react-native";

import { CARE_CARD_SHADOW } from "@/features/care/styles";
import { Card } from "@/shared/components/Card";
import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";
import { SentenceList } from "@/shared/components/SentenceList";

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
      className="mt-4 border-1 border-concierge-primary bg-white px-3.5 py-3.5"
      style={CARE_CARD_SHADOW}
    >
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
      <Pressable
        onPress={onOpenReport}
        className="mt-2 flex-row items-center justify-end gap-1"
      >
        <Text className="text-[11px] font-medium text-concierge-text">
          상태 리포트 보기
        </Text>
        <ChevronRightIcon size={5} />
      </Pressable>
    </Card>
  );
}
