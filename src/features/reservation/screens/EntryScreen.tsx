import { useRouter } from "expo-router";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import calendarIcon from "@/features/reservation/assets/calendar.png";
import giftIcon from "@/features/reservation/assets/gift.png";
import timeIcon from "@/features/reservation/assets/time.png";
import { formatDateTimeMeridiem } from "@/features/reservation/format";
import { useReservationStore } from "@/features/reservation/store";
import { Card } from "@/shared/components/Card";
import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";
import { PrimaryButton } from "@/shared/components/PrimaryButton";

// 예약 상세/입력 화면 어디로 이동해도 항상 붙어있는 카드 — Figma에서 예약있음/승인대기/예약없음 3개
// 상태 전부에 동일하게 들어가 있는 걸 확인했어요.
function PromoCard({ onPress }: { onPress: () => void }) {
  return (
    <Card className="mt-4 border-0 bg-white px-5 py-5">
      <View className="flex-row items-center gap-4">
        <View className="size-[85px] items-center justify-center rounded-full bg-concierge-surfaceMuted">
          <Image source={calendarIcon} className="size-10" resizeMode="contain" />
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

// 실제 무상케어 제안 API가 붙기 전까지, 테스트용으로 화면 상태를 바로 전환해볼 수 있는 토글이에요.
type TestState = "FREE_SUGGESTION" | "PENDING" | "CONFIRMED";

function StatusTestToggle({
  current,
  onSelect,
}: {
  current: TestState;
  onSelect: (state: TestState) => void;
}) {
  const options: { key: TestState; label: string }[] = [
    { key: "FREE_SUGGESTION", label: "무상제안" },
    { key: "PENDING", label: "승인대기" },
    { key: "CONFIRMED", label: "확정" },
  ];

  return (
    <View className="mt-3 flex-row items-center gap-2 rounded-xl border border-dashed border-concierge-border bg-white px-3 py-2.5">
      <Text className="text-xs font-semibold text-concierge-textMuted">테스트</Text>
      <View className="flex-1 flex-row flex-wrap justify-end gap-1.5">
        {options.map((option) => (
          <Pressable
            key={option.key}
            onPress={() => onSelect(option.key)}
            className={`rounded-full px-2.5 py-1 ${
              current === option.key ? "bg-concierge-primary" : "bg-concierge-chip"
            }`}
          >
            <Text
              className={`text-xs ${
                current === option.key ? "text-white" : "text-concierge-textSecondary"
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function EntryScreen() {
  const router = useRouter();
  const confirmed = useReservationStore((state) => state.confirmed);
  const setTestState = useReservationStore((state) => state.setTestState);
  const setPendingCareType = useReservationStore((state) => state.setPendingCareType);

  const testState: TestState = confirmed
    ? confirmed.status === "PENDING"
      ? "PENDING"
      : "CONFIRMED"
    : "FREE_SUGGESTION";

  const handleTestSelect = (state: TestState) => {
    if (state === "FREE_SUGGESTION") {
      setTestState("NONE");
      return;
    }
    setTestState(state, "PAID");
  };

  const goToInput = (careType: "FREE" | "PAID") => {
    setPendingCareType(careType);
    router.push("/reservation/input");
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView className="flex-1 px-6 pt-4" contentContainerClassName="pb-6">
        <Text className="text-xl font-bold text-concierge-text">
          케어 컨시어지 예약
        </Text>

        <StatusTestToggle current={testState} onSelect={handleTestSelect} />

        <Text className="mt-6 text-base font-semibold text-[#1E1A17]">
          예약 현황
        </Text>

        {confirmed && confirmed.status === "PENDING" ? (
          <Card className="mt-3 rounded-[20px] border-0 bg-concierge-surfaceMuted px-6 py-6">
            <View className="flex-row items-center gap-4">
              <View className="size-[85px] items-center justify-center rounded-full bg-white">
                <Image source={timeIcon} className="size-9" resizeMode="contain" />
              </View>
              <View className="flex-1">
                <Text className="text-xl font-semibold text-[#1E1A17]">
                  예약 승인 대기중
                </Text>
                <Text className="mt-2 text-sm text-concierge-textSecondary">
                  매장에서 예약을 확인하고 있어요.
                </Text>
                <Text className="mt-2 text-sm text-concierge-textSecondary">
                  예약이 확정되면{"\n"}이 화면에서 확인할 수 있어요.
                </Text>
              </View>
            </View>
            <PrimaryButton
              label="예약 상세 보기"
              onPress={() => router.push("/reservation/detail")}
              className="mt-6 w-full"
            />
          </Card>
        ) : confirmed ? (
          <Card className="mt-3 rounded-[20px] border-0 bg-concierge-surfaceMuted px-6 py-6">
            <View className="flex-row items-center gap-2">
              <View className="size-1.5 rounded-full bg-concierge-primary" />
              <Text className="text-xs font-bold text-[#6D5243]">
                예약 완료
              </Text>
            </View>

            <Text className="mt-5 text-sm text-concierge-textSecondary">
              예약 일시
            </Text>
            <Text className="mb-1 text-lg font-bold text-[#221F1D]">
              {formatDateTimeMeridiem(confirmed.date, confirmed.time)}
            </Text>

            <View className="mt-3 border-t border-concierge-borderLight" />

            <View className="mt-3 flex-row items-end justify-between">
              <View>
                <Text className="text-sm text-concierge-textSecondary">
                  매장
                </Text>
                <Text className="mt-1 text-lg font-semibold text-[#221F1D]">
                  {confirmed.storeName}
                </Text>
                <Text className="text-xs text-[#6E6965]">
                  {confirmed.storeAddress}
                </Text>
              </View>
              <View className="flex-row items-center gap-1 rounded-[10px] border border-concierge-border bg-white px-3 py-1.5">
                <Text className="text-xs text-[#3E352F]">
                  매장 자세히 보기
                </Text>
                <ChevronRightIcon size={6} />
              </View>
            </View>

            <View className="mt-4 flex-row gap-2">
              <Pressable
                onPress={() => router.push("/reservation/detail")}
                className="flex-1 items-center justify-center rounded-xl border border-concierge-border bg-white py-3"
              >
                <Text className="text-base font-semibold text-[#5C4A40]">
                  일정 변경
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/reservation/detail")}
                className="flex-1 items-center justify-center rounded-xl bg-concierge-primary py-3"
              >
                <Text className="text-base font-semibold text-white">
                  예약 상세 보기
                </Text>
              </Pressable>
            </View>
          </Card>
        ) : (
          <Card className="mt-3 rounded-[20px] border-0 bg-concierge-surfaceMuted px-6 py-6">
            <View className="flex-row items-center gap-4">
              <View className="size-[85px] items-center justify-center rounded-full bg-white">
                <Image source={giftIcon} className="size-9" resizeMode="contain" />
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
              onPress={() => goToInput("FREE")}
              className="mt-6 w-full"
            />
          </Card>
        )}

        <PromoCard onPress={() => goToInput("PAID")} />
      </ScrollView>
    </SafeAreaView>
  );
}
