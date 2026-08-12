import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  RESERVATION_TIME_SLOTS,
  RESERVATION_WEEKDAY_LABELS,
} from "@/features/reservation/constants";
import { formatDateKoreanFull } from "@/features/reservation/format";
import { useReservationStore } from "@/features/reservation/store";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { ScreenHeader } from "@/shared/components/ScreenHeader";

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getCalendarWeeks(monthDate: Date): (Date | null)[][] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = new Array(firstDay.getDay()).fill(null);
  for (let d = 1; d <= daysInMonth; d += 1)
    cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function DateTimeScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEditMode = mode === "edit";

  const draft = useReservationStore((state) => state.draft);
  const confirmed = useReservationStore((state) => state.confirmed);
  const setDraftDateTime = useReservationStore(
    (state) => state.setDraftDateTime,
  );
  const updateConfirmedDateTime = useReservationStore(
    (state) => state.updateConfirmedDateTime,
  );

  const storeName = isEditMode
    ? (confirmed?.storeName ?? null)
    : draft.storeName;
  const storeAddress = isEditMode
    ? (confirmed?.storeAddress ?? null)
    : draft.storeAddress;
  const initialDate = isEditMode ? (confirmed?.date ?? null) : draft.date;
  const initialTime = isEditMode ? (confirmed?.time ?? null) : draft.time;

  const today = useMemo(() => startOfDay(new Date()), []);
  const [visibleMonth, setVisibleMonth] = useState(() => initialDate ?? today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);
  const [selectedTime, setSelectedTime] = useState<string | null>(initialTime);

  const weeks = useMemo(() => getCalendarWeeks(visibleMonth), [visibleMonth]);
  const canSubmit = Boolean(selectedDate && selectedTime);

  const goToMonth = (offset: number) => {
    setVisibleMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1),
    );
  };

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) return;
    if (isEditMode) {
      updateConfirmedDateTime(selectedDate, selectedTime);
    } else {
      setDraftDateTime(selectedDate, selectedTime);
    }
    router.back();
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <View className="px-6 pt-3">
        <ScreenHeader title="날짜·시간 선택" onBack={() => router.back()} />

        <View className="mt-4">
          <Text className="text-base font-semibold text-concierge-text">
            {storeName ?? "매장을 먼저 선택해 주세요"}
          </Text>
          {storeAddress ? (
            <Text className="mt-1 text-xs text-concierge-textMuted">
              {storeAddress}
            </Text>
          ) : null}
        </View>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerClassName="pb-6">
        <View className="mt-4 rounded-xl border border-concierge-border bg-white px-4 py-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-[15px] font-bold text-concierge-text">
              {visibleMonth.getFullYear()}년 {visibleMonth.getMonth() + 1}월
            </Text>
            <View className="flex-row gap-4">
              <Pressable onPress={() => goToMonth(-1)} hitSlop={8}>
                <Text className="text-base font-medium text-concierge-textSecondary">
                  ‹
                </Text>
              </Pressable>
              <Pressable onPress={() => goToMonth(1)} hitSlop={8}>
                <Text className="text-base font-medium text-concierge-textSecondary">
                  ›
                </Text>
              </Pressable>
            </View>
          </View>

          <View className="mt-3 flex-row">
            {RESERVATION_WEEKDAY_LABELS.map((label) => (
              <View key={label} className="w-[14.28%] items-center py-1">
                <Text className="text-[11px] text-concierge-textSecondary">
                  {label}
                </Text>
              </View>
            ))}
          </View>

          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} className="flex-row">
              {week.map((date, dayIndex) => {
                if (!date)
                  return (
                    <View key={dayIndex} className="h-[34px] w-[14.28%]" />
                  );

                const disabled = date.getTime() < today.getTime();
                const selected = selectedDate
                  ? isSameDay(date, selectedDate)
                  : false;

                return (
                  <View
                    key={dayIndex}
                    className="w-[14.28%] items-center py-0.5"
                  >
                    <Pressable
                      disabled={disabled}
                      onPress={() => setSelectedDate(date)}
                      className={`size-[34px] items-center justify-center rounded-full ${
                        selected ? "bg-concierge-primary" : ""
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          selected
                            ? "font-bold text-white"
                            : disabled
                              ? "text-[#C7C2BC]"
                              : "font-medium text-concierge-text"
                        }`}
                      >
                        {date.getDate()}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <View className="mt-4 rounded-xl bg-concierge-surfaceMuted px-4 py-3">
          <Text className="text-xs text-concierge-textSecondary">
            선택한 일정
          </Text>
          <Text className="mt-1 text-[15px] font-semibold text-concierge-text">
            {selectedDate && selectedTime
              ? `${formatDateKoreanFull(selectedDate)} · ${selectedTime}`
              : "날짜와 시간을 선택해 주세요"}
          </Text>
        </View>

        <Text className="mt-5 text-sm font-semibold text-concierge-text">
          예약 가능 시간
        </Text>
        <View className="mt-3 flex-row flex-wrap gap-x-[9px] gap-y-2.5">
          {RESERVATION_TIME_SLOTS.map((slot) => {
            const selected = selectedTime === slot;
            return (
              <Pressable
                key={slot}
                onPress={() => setSelectedTime(slot)}
                className={`w-[23%] items-center rounded-[9px] py-2 ${
                  selected
                    ? "bg-concierge-primary"
                    : "bg-concierge-surfaceMuted"
                }`}
              >
                <Text
                  className={`text-[13px] ${selected ? "font-semibold text-white" : "text-concierge-text"}`}
                >
                  {slot}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View className="px-6 pb-4 pt-2">
        <PrimaryButton
          label="선택 완료"
          onPress={handleConfirm}
          disabled={!canSubmit}
        />
      </View>
    </SafeAreaView>
  );
}
