import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { formatDateDot } from "@/features/reservation/format";
import { useReservationStore } from "@/features/reservation/store";
import { CheckmarkCircleIcon } from "@/shared/components/icons/CheckmarkCircleIcon";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { ScreenHeader } from "@/shared/components/ScreenHeader";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <Text className="text-sm font-semibold text-concierge-textSecondary">
        {label}
      </Text>
      <View className="h-px flex-1 " />
      <Text className="text-sm font-semibold text-concierge-text">{value}</Text>
    </View>
  );
}

export function CompleteScreen() {
  const router = useRouter();
  const confirmed = useReservationStore((state) => state.confirmed);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <View className="px-6 pt-3">
        <ScreenHeader title="" onBack={() => router.back()} />
      </View>

      {confirmed ? (
        <View className="flex-1 px-6 pt-4">
          <View className="items-center mt-10">
            <CheckmarkCircleIcon />
            <Text className="mt-5 text-xl font-bold text-concierge-text">
              제품을 위한 시간이 준비되었습니다.
            </Text>
            <Text className="mt-5 text-center text-sm font-semibold text-concierge-textSecondary">
              예약 정보를 확인하고 편안하게 방문해 주세요.
            </Text>
          </View>

          <View className="mt-6 gap-3 rounded-xl px-4 py-3.5">
            <InfoRow label="제품" value={confirmed.productName} />
            <InfoRow label="매장" value={confirmed.storeName} />
            <InfoRow label="날짜" value={formatDateDot(confirmed.date)} />
            <InfoRow label="시간" value={confirmed.time} />
          </View>

          <View className="mt-4 gap-1.5 rounded-xl bg-concierge-surfaceMuted px-4 py-3">
            <Text className="text-sm font-semibold text-concierge-text">
              방문 안내
            </Text>
            <Text className="text-sm text-concierge-textSecondary">
              예약 시간 5분 전 매장에 도착해 제품을 함께 전달해 주세요.
            </Text>
          </View>

          <View className="flex-1" />

          <View className="pb-10">
            <PrimaryButton
              label="예약 상세 보기"
              onPress={() => router.replace("/reservation/detail")}
            />
          </View>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-sm text-concierge-textMuted">
            확인된 예약 정보가 없어요.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
