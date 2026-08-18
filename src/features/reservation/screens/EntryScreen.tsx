import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCurrentProduct } from "@/features/product/hooks/useProduct";
import calendarIcon from "@/features/reservation/assets/calendar.png";
import giftIcon from "@/features/reservation/assets/gift.png";
import {
  formatDateTimeMeridiem,
  toReservationDateTime,
} from "@/features/reservation/format";
import {
  useActiveReservation,
  useReservation,
} from "@/features/reservation/hooks/useReservation";
import { useReservationStore } from "@/features/reservation/store";
import type {
  ReservationStatus,
  ReservationType,
} from "@/features/reservation/types";
import { Card } from "@/shared/components/Card";
import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";
import { PrimaryButton } from "@/shared/components/PrimaryButton";

/** 유상 케어 진입 카드 — "케어 컨시어지 예약" */
function ConciergePromoCard({ onPress }: { onPress: () => void }) {
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

/** 무상 케어 진입 카드 */
function FreeCareCard({ onPress }: { onPress: () => void }) {
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

/**
 * 예약 현황 카드 — 상태에 따라 라벨이 바뀌어요.
 * 컨시어지(유상) 예약은 담당자 승인을 거치므로 확정 전에는 "승인 대기"로 보여줍니다.
 */
function ReservationStatusCard({
  status,
  dateLabel,
  storeName,
  storeAddress,
  onPressEditSchedule,
  onPressDetail,
}: {
  status: ReservationStatus;
  dateLabel: string;
  storeName: string;
  storeAddress?: string | null;
  onPressEditSchedule: () => void;
  onPressDetail: () => void;
}) {
  const isPendingApproval = status === "PENDING_APPROVAL";

  return (
    <Card className="mt-3 rounded-[20px] border-0 bg-concierge-surfaceMuted px-6 py-6">
      <View className="flex-row items-center gap-2">
        <View
          className={`size-1.5 rounded-full ${
            isPendingApproval ? "bg-concierge-accentMuted" : "bg-concierge-primary"
          }`}
        />
        <Text className="text-xs font-bold text-[#6D5243]">
          {isPendingApproval ? "승인 대기" : "예약 완료"}
        </Text>
      </View>

      {isPendingApproval ? (
        <Text className="mt-2 text-sm text-concierge-textSecondary">
          매장 담당자가 예약을 확인하고 있어요. 확정되면 알려드릴게요.
        </Text>
      ) : null}

      <Text className="mt-5 text-sm text-concierge-textSecondary">
        예약 일시
      </Text>
      <Text className="mb-1 text-lg font-bold text-[#221F1D]">{dateLabel}</Text>

      <View className="mt-3 border-t border-concierge-borderLight" />

      <View className="mt-3 flex-row items-end justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-sm text-concierge-textSecondary">매장</Text>
          <Text className="mt-1 text-lg font-semibold text-[#221F1D]">
            {storeName}
          </Text>
          {storeAddress ? (
            <Text className="text-xs text-[#6E6965]">{storeAddress}</Text>
          ) : null}
        </View>
        <View className="flex-row items-center gap-1 rounded-[10px] border border-concierge-border bg-white px-3 py-1.5">
          <Text className="text-xs text-[#3E352F]">매장 자세히 보기</Text>
          <ChevronRightIcon size={6} />
        </View>
      </View>

      <View className="mt-4 flex-row gap-2">
        <Pressable
          onPress={onPressEditSchedule}
          className="flex-1 items-center justify-center rounded-xl border border-concierge-border  py-3"
        >
          <Text className="text-base font-semibold  text-[#5C4A40]">
            일정 변경
          </Text>
        </Pressable>
        <Pressable
          onPress={onPressDetail}
          className="flex-1 items-center justify-center rounded-xl bg-[#8C6748] py-3"
        >
          <Text className="text-base font-semibold text-white">
            예약 상세 보기
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}

export function EntryScreen() {
  const router = useRouter();
  const setPendingCareType = useReservationStore(
    (state) => state.setPendingCareType,
  );
  const resetDraft = useReservationStore((state) => state.resetDraft);

  // 예약 현황은 "메인으로 선택한 가방"의 예약만 봅니다.
  const { productId, isPending: isProductPending } = useCurrentProduct();
  const {
    activeReservation,
    isPending: isReservationPending,
    error,
  } = useActiveReservation(productId);
  // 매장 주소는 목록 응답에 없어서 상세를 한 번 더 불러와요.
  const { data: activeDetail } = useReservation(activeReservation?.id ?? null);

  const isPending = isProductPending || isReservationPending;

  const dateTime = activeReservation
    ? toReservationDateTime(
        activeReservation.reservedDate,
        activeReservation.reservedTime,
      )
    : null;

  const goToInput = (careType: ReservationType) => {
    setPendingCareType(careType);
    resetDraft();
    router.push("/reservation/input");
  };

  const goToDetail = () => {
    if (!activeReservation) return;

    router.push({
      pathname: "/reservation/detail",
      params: { id: String(activeReservation.id) },
    });
  };

  const goToEditSchedule = () => {
    if (!activeReservation) return;

    router.push({
      pathname: "/reservation/datetime",
      params: { mode: "edit", id: String(activeReservation.id) },
    });
  };

  // 진행 중 예약이 있으면 남은 카드는 "반대편 예약 경로"를 안내해요.
  // 컨시어지(유상) 예약 중이면 무상 케어 카드를, 무상 케어 예약 중이면 컨시어지 카드를 보여줍니다.
  const secondaryCard =
    activeReservation?.reservationType === "PAID" ? (
      <FreeCareCard onPress={() => goToInput("FREE")} />
    ) : (
      <ConciergePromoCard onPress={() => goToInput("PAID")} />
    );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView className="flex-1 px-6 pt-6" contentContainerClassName="pb-6">
        <Text className="text-xl font-bold text-concierge-text">
          케어 컨시어지 예약
        </Text>

        <Text className="mt-10 text-base font-semibold text-[#1E1A17]">
          예약 현황
        </Text>

        {isPending ? (
          <Card className="mt-3 items-center rounded-[20px] border-0 bg-concierge-surfaceMuted px-6 py-10">
            <ActivityIndicator />
          </Card>
        ) : activeReservation && dateTime ? (
          <>
            <ReservationStatusCard
              status={activeReservation.status}
              dateLabel={formatDateTimeMeridiem(dateTime.date, dateTime.time)}
              storeName={activeReservation.storeName ?? "-"}
              storeAddress={activeDetail?.storeAddress}
              onPressEditSchedule={goToEditSchedule}
              onPressDetail={goToDetail}
            />
            {secondaryCard}
          </>
        ) : (
          // 진행 중 예약이 없으면 무상 케어 제안과 컨시어지 예약 카드를 함께 보여줘요.
          <>
            <FreeCareCard onPress={() => goToInput("FREE")} />
            <ConciergePromoCard onPress={() => goToInput("PAID")} />
          </>
        )}

        {error ? (
          <Text className="mt-3 text-xs text-[#C04737]">{error.message}</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
