import { useRouter } from "expo-router";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import productThumb from "@/features/reservation/assets/product-thumb-small.png";
import { formatDateShort } from "@/features/reservation/format";
import { useReservationStore } from "@/features/reservation/store";
import { Card } from "@/shared/components/Card";
import { ScreenHeader } from "@/shared/components/ScreenHeader";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <Text className="text-sm font-semibold text-concierge-textSecondary">
        {label}
      </Text>
      <View className="flex-1" />
      <Text className="text-sm font-semibold text-concierge-text">{value}</Text>
    </View>
  );
}

export function DetailScreen() {
  const router = useRouter();
  const confirmed = useReservationStore((state) => state.confirmed);
  const cancelReservation = useReservationStore(
    (state) => state.cancelReservation,
  );

  const handleCancel = () => {
    Alert.alert("예약을 취소할까요?", "취소 후에는 되돌릴 수 없어요.", [
      { text: "닫기", style: "cancel" },
      {
        text: "예약 취소",
        style: "destructive",
        onPress: () => {
          cancelReservation();
          router.replace("/(tabs)/reservation");
        },
      },
    ]);
  };

  if (!confirmed) {
    return (
      <SafeAreaView
        edges={["top"]}
        className="flex-1 items-center justify-center bg-concierge-bg px-6"
      >
        <Text className="text-sm text-concierge-textMuted">
          확인된 예약 정보가 없어요.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <View className="px-6 pt-3">
        <ScreenHeader
          title="예약 상세"
          onBack={() => router.back()}
          right={
            <View className="rounded-full bg-concierge-chip px-2 py-1.5">
              <Text className="text-xs text-concierge-textSecondary">
                예약 확정
              </Text>
            </View>
          }
        />
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerClassName="gap-3 pb-6"
      >
        <Card className="mt-4 gap-3 bg-white px-4 py-3.5">
          <View className="flex-row items-center gap-3">
            <Image
              source={productThumb}
              className="size-[58px] rounded-2xl"
              resizeMode="cover"
            />
            <View>
              <Text className="text-sm font-semibold text-concierge-text">
                {confirmed.productName}
              </Text>
              <Text className="mt-0.5 text-xs text-concierge-textMuted">
                제품 컨디션 점검
              </Text>
            </View>
          </View>

          <View className="border-t border-concierge-borderLight" />

          <DetailRow label="매장" value={confirmed.storeName} />
          <DetailRow
            label="일정"
            value={`${formatDateShort(confirmed.date)} · ${confirmed.time}`}
          />
          <DetailRow label="예약 상태" value="예약 확정" />

          <View className="border-t border-concierge-borderLight" />

          <Text className="text-sm font-semibold text-concierge-text">
            요청사항
          </Text>
          <Text className="text-xs text-concierge-textMuted">
            {confirmed.note || "전달된 요청사항이 없어요."}
          </Text>
        </Card>

        <Card className="gap-1.5 bg-white px-4 py-3">
          <Text className="text-sm font-semibold text-concierge-textSecondary">
            매장 연락처
          </Text>
          <Text className="text-sm font-semibold text-concierge-text">
            02-0000-0000
          </Text>
        </Card>

        <View className="gap-1 rounded-xl bg-concierge-surfaceMuted px-4 py-3">
          <Text className="text-xs font-semibold text-concierge-text">
            변경·취소 안내
          </Text>
          <Text className="text-xs text-concierge-textSecondary">
            방문 일정 변경은 가능한 시간 범위에서 다시 선택할 수 있습니다.
          </Text>
        </View>

        <View className="mt-10 gap-2">
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/reservation/datetime",
                params: { mode: "edit" },
              })
            }
            className="items-center justify-center rounded-xl border border-concierge-border bg-white py-3.5"
          >
            <Text className="text-base font-semibold text-concierge-text">
              일정 변경
            </Text>
          </Pressable>
          <Pressable
            onPress={handleCancel}
            className="items-center justify-center rounded-xl border border-concierge-border bg-white py-3.5"
          >
            <Text className="text-base font-semibold text-concierge-text">
              예약 취소
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
