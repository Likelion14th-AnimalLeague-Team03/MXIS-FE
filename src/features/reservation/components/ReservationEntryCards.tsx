import { Image, Text, View } from "react-native";

import calendarIcon from "@/features/reservation/assets/calendar.png";
import giftIcon from "@/features/reservation/assets/gift.png";
import { Card } from "@/shared/components/Card";
import { PrimaryButton } from "@/shared/components/PrimaryButton";

export function ConciergePromoCard({ onPress }: { onPress: () => void }) {
  return (
    <Card className="mt-4 border-0 bg-white px-5 py-5">
      <View className="flex-row items-center gap-4">
        <View className="size-[85px] items-center justify-center rounded-full bg-concierge-surfaceMuted">
          <Image
            source={calendarIcon}
            className="size-10"
            resizeMode="contain"
          />
        </View>
        <View className="flex-1">
          <Text className="text-xl font-semibold text-[#221F1D]">
            케어 컨시어지 예약
          </Text>
          <Text className="mt-1 text-sm text-[#4E4945]">
            예약 현황 확인, 새로운 예약, 변경/취소까지 한 번에 관리하세요.
          </Text>
        </View>
      </View>
      <PrimaryButton label="예약 바로가기" onPress={onPress} className="mt-4" />
    </Card>
  );
}

export function FreeCareCard({ onPress }: { onPress: () => void }) {
  return (
    <Card className="mt-4 rounded-[20px] border-0 bg-concierge-surfaceMuted px-6 py-6">
      <View className="flex-row items-center gap-4">
        <View className="size-[85px] items-center justify-center rounded-full bg-white">
          <Image source={giftIcon} className="size-12" resizeMode="contain" />
        </View>
        <View className="flex-1">
          <Text className="text-xl font-semibold text-[#1E1A17]">
            무상 케어를 제안드려요.
          </Text>
          <Text className="mt-2.5 text-sm leading-5 text-[#4A423C]">
            가까운 매장에서 케어 서비스를{"\n"}예약해보세요.
          </Text>
        </View>
      </View>
      <PrimaryButton
        label="예약 바로가기"
        onPress={onPress}
        className="mt-6 w-full"
      />
    </Card>
  );
}
