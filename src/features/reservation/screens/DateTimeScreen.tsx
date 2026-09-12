import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ReservationCalendar } from "@/features/reservation/components/ReservationCalendar";
import { ReservationTimeSelection } from "@/features/reservation/components/ReservationTimeSelection";
import {
  normalizeSlotTime,
  toReservationDateTime,
} from "@/features/reservation/format";
import {
  useAvailableTimes,
  useReservation,
  useUpdateReservation,
} from "@/features/reservation/hooks/useReservation";
import { useReservationStore } from "@/features/reservation/store";
import type { TimeSlot } from "@/features/reservation/types";
import { startOfCalendarDay } from "@/features/reservation/utils/calendar";
import { formatLocalDate, toLocalTimeString } from "@/shared/api/localTime";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { ScreenHeader } from "@/shared/components/ScreenHeader";

export function DateTimeScreen() {
  const router = useRouter();
  const { mode, id } = useLocalSearchParams<{ mode?: string; id?: string }>();
  const isEditMode = mode === "edit";
  const reservationId = id ? Number(id) : null;

  const draft = useReservationStore((state) => state.draft);
  const setDraftDateTime = useReservationStore((state) => state.setDraftDateTime);
  const { data: reservation } = useReservation(isEditMode ? reservationId : null);
  const updateReservation = useUpdateReservation();

  const reservationDateTime = reservation
    ? toReservationDateTime(reservation.reservedDate, reservation.reservedTime)
    : null;
  const storeId = isEditMode ? (reservation?.storeId ?? null) : draft.storeId;
  const storeName = isEditMode ? (reservation?.storeName ?? null) : draft.storeName;
  const storeAddress = isEditMode
    ? (reservation?.storeAddress ?? null)
    : draft.storeAddress;
  const initialDate = isEditMode ? (reservationDateTime?.date ?? null) : draft.date;
  const initialTime = isEditMode ? (reservationDateTime?.time ?? null) : draft.time;

  const today = useMemo(() => startOfCalendarDay(new Date()), []);
  const [visibleMonth, setVisibleMonth] = useState(() => initialDate ?? today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);
  const [selectedTime, setSelectedTime] = useState<string | null>(initialTime);
  const [showTimeWarning, setShowTimeWarning] = useState(false);

  const {
    data: availableTimes,
    isPending: isSlotsPending,
    error: slotsError,
  } = useAvailableTimes(
    storeId,
    selectedDate ? formatLocalDate(selectedDate) : null,
  );
  const slots = (availableTimes?.slots ?? []).map((slot) => ({
    ...slot,
    time: normalizeSlotTime(slot.time),
  }));
  const canSubmit =
    Boolean(selectedDate && selectedTime) && !updateReservation.isPending;

  const goToMonth = (offset: number) => {
    setVisibleMonth(
      (currentMonth) =>
        new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + offset,
          1,
        ),
    );
  };

  const selectDate = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setShowTimeWarning(false);
  };

  const selectTime = (slot: TimeSlot) => {
    if (!slot.available) {
      setShowTimeWarning(true);
      return;
    }

    setShowTimeWarning(false);
    setSelectedTime(slot.time);
  };

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) return;

    if (isEditMode) {
      if (reservationId === null) return;

      updateReservation.mutate(
        {
          id: reservationId,
          request: {
            reservedDate: formatLocalDate(selectedDate),
            reservedTime: toLocalTimeString(selectedTime),
          },
        },
        { onSuccess: () => router.back() },
      );
      return;
    }

    setDraftDateTime(selectedDate, selectedTime);
    router.back();
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <View className="px-6 pt-6">
        <ScreenHeader title="날짜·시간 선택" onBack={() => router.back()} />
        <View className="mt-4 rounded-xl bg-[#F6F5F2] px-4 py-3.5">
          <Text className="text-base font-bold text-concierge-text">
            {storeName ?? "매장을 먼저 선택해 주세요"}
          </Text>
          {storeAddress ? (
            <Text className="mt-1 text-sm text-concierge-textMuted">
              {storeAddress}
            </Text>
          ) : null}
        </View>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerClassName="pb-6">
        <ReservationCalendar
          onChangeMonth={goToMonth}
          onSelectDate={selectDate}
          selectedDate={selectedDate}
          today={today}
          visibleMonth={visibleMonth}
        />
        <ReservationTimeSelection
          errorMessage={slotsError?.message ?? null}
          isPending={isSlotsPending}
          onSelectTime={selectTime}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          showTimeWarning={showTimeWarning}
          slots={slots}
        />

        {updateReservation.error ? (
          <Text className="mt-3 text-xs text-[#C04737]">
            {updateReservation.error.message}
          </Text>
        ) : null}
      </ScrollView>

      <View className="px-6 pb-4 pt-2">
        <PrimaryButton
          label={isEditMode ? "일정 변경하기" : "선택 완료"}
          onPress={handleConfirm}
          disabled={!canSubmit}
        />
      </View>
    </SafeAreaView>
  );
}
