import { Linking, Pressable, Text, View } from "react-native";

import { RESERVATION_TYPE_LABEL } from "@/features/reservation/constants";
import { toReservationDateTime } from "@/features/reservation/format";
import { useReservation } from "@/features/reservation/hooks/useReservation";
import type { ReservationSummary } from "@/features/reservation/types";
import { Card } from "@/shared/components/Card";
import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";
import { formatDateTimeMeridiem } from "@/shared/utils/dateFormat";

export function ReservationStatusCard({
  reservation,
  onPressEditSchedule,
  onPressDetail,
}: {
  reservation: ReservationSummary;
  onPressEditSchedule: () => void;
  onPressDetail: () => void;
}) {
  const { data: detail } = useReservation(reservation.id);
  const isPendingApproval = reservation.status === "PENDING_APPROVAL";
  const dateTime = toReservationDateTime(
    reservation.reservedDate,
    reservation.reservedTime,
  );
  const dateLabel = formatDateTimeMeridiem(dateTime.date, dateTime.time);
  const storeName = reservation.storeName ?? detail?.storeName ?? "-";
  const storeAddress = reservation.storeAddress ?? detail?.storeAddress ?? null;
  const storeUrl = detail?.storeUrl ?? null;

  const openStorePage = async () => {
    if (!storeUrl) return;

    try {
      await Linking.openURL(storeUrl);
    } catch {
      // A malformed external URL must not block access to reservation details.
    }
  };

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
        <View className="flex-1" />
        <Text className="text-xs font-semibold text-[#8C6748]">
          {RESERVATION_TYPE_LABEL[reservation.reservationType]}
        </Text>
      </View>

      {isPendingApproval ? (
        <Text className="mt-2 text-sm text-concierge-textSecondary">
          매장 담당자가 예약을 확인하고 있어요. 확정되면 알려드릴게요.
        </Text>
      ) : null}

      <Text className="mt-5 text-sm text-concierge-textSecondary">예약 일시</Text>
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
        <Pressable
          onPress={openStorePage}
          disabled={!storeUrl}
          accessibilityRole="link"
          accessibilityLabel={`${storeName} 매장 페이지 열기`}
          className={`flex-row items-center gap-1 rounded-[10px] border border-concierge-border bg-white px-3 py-1.5 ${
            storeUrl ? "" : "opacity-40"
          }`}
        >
          <Text className="text-xs text-[#3E352F]">매장 자세히 보기</Text>
          <ChevronRightIcon size={6} />
        </Pressable>
      </View>

      <View className="mt-4 flex-row gap-2">
        <Pressable
          onPress={onPressEditSchedule}
          className="flex-1 items-center justify-center rounded-xl border border-concierge-border  py-3"
        >
          <Text className="text-base font-semibold  text-[#5C4A40]">일정 변경</Text>
        </Pressable>
        <Pressable
          onPress={onPressDetail}
          className="flex-1 items-center justify-center rounded-xl bg-[#8C6748] py-3"
        >
          <Text className="text-base font-semibold text-white">예약 상세 보기</Text>
        </Pressable>
      </View>
    </Card>
  );
}
