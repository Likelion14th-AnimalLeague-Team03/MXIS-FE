import { Pressable, Text } from "react-native";

import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";
import { ShadowCard } from "@/shared/components/ShadowCard";

export function CareRecommendationCard({
  noticeLabel,
  title,
  onPressReserve,
}: {
  noticeLabel: string | null;
  title: string;
  onPressReserve: () => void;
}) {
  return (
    <ShadowCard
      className="mt-2"
      contentClassName={`border border-concierge-primary bg-white ${
        noticeLabel ? "pt-4" : "pt-[27px]"
      }`}
    >
      {noticeLabel ? (
        <Text
          className="px-[15px] text-xs font-medium text-concierge-textSecondary"
          style={{ lineHeight: 17 }}
        >
          {noticeLabel}
        </Text>
      ) : null}
      <Text
        className="px-[15px] pt-1 text-[15px] font-bold text-concierge-text"
        style={{ lineHeight: 21 }}
      >
        {title}
      </Text>
      <Pressable
        onPress={onPressReserve}
        className="mx-[7px] mb-[7px] mt-[14px] h-[37px] flex-row items-center justify-between rounded-[9px] bg-concierge-primary pl-2 pr-4"
      >
        <Text className="text-sm font-medium text-white">
          케어 예약 바로가기
        </Text>
        <ChevronRightIcon size={9} color="#FFFFFF" />
      </Pressable>
    </ShadowCard>
  );
}
