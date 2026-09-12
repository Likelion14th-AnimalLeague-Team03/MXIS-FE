import { ActivityIndicator, Pressable, Text, View } from "react-native";

import type { TimeSlot } from "@/features/reservation/types";
import { formatDateKoreanFull } from "@/shared/utils/dateFormat";

export function ReservationTimeSelection({
  errorMessage,
  isPending,
  onSelectTime,
  selectedDate,
  selectedTime,
  showTimeWarning,
  slots,
}: {
  errorMessage: string | null;
  isPending: boolean;
  onSelectTime: (slot: TimeSlot) => void;
  selectedDate: Date | null;
  selectedTime: string | null;
  showTimeWarning: boolean;
  slots: TimeSlot[];
}) {
  return (
    <>
      <Text className="mt-5 text-sm font-semibold text-concierge-text">
        예약 가능 시간
      </Text>
      {showTimeWarning ? (
        <View className="mt-3 self-start rounded-lg bg-[#FCE9E9] px-3 py-2">
          <Text className="text-xs font-medium text-[#E05252]">
            다른 시간을 선택해주세요
          </Text>
        </View>
      ) : null}

      {!selectedDate ? (
        <Text className="mt-3 text-xs text-concierge-textMuted">
          날짜를 먼저 선택해 주세요.
        </Text>
      ) : isPending ? (
        <View className="mt-4 items-start">
          <ActivityIndicator />
        </View>
      ) : errorMessage ? (
        <Text className="mt-3 text-xs text-[#C04737]">{errorMessage}</Text>
      ) : slots.length === 0 ? (
        <Text className="mt-3 text-xs text-concierge-textMuted">
          선택한 날짜에 예약 가능한 시간이 없어요.
        </Text>
      ) : (
        <View className="mt-3 flex-row flex-wrap gap-x-[9px] gap-y-2.5">
          {slots.map((slot) => {
            const selected = selectedTime === slot.time;
            const unavailable = !slot.available;

            return (
              <Pressable
                key={slot.time}
                onPress={() => onSelectTime(slot)}
                className={`w-[23%] items-center rounded-[9px] py-2 ${
                  selected
                    ? "bg-concierge-primary"
                    : unavailable
                      ? "bg-[#E2DDD7]"
                      : "bg-concierge-surfaceMuted"
                }`}
              >
                <Text
                  className={`text-[13px] ${
                    selected
                      ? "font-semibold text-white"
                      : unavailable
                        ? "text-[#A8A19A]"
                        : "text-concierge-text"
                  }`}
                >
                  {slot.time}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <View className="mt-4 rounded-xl bg-concierge-surfaceMuted px-4 py-3">
        <Text className="text-xs text-concierge-textSecondary">선택한 일정</Text>
        <Text className="mt-1 text-[15px] font-semibold text-concierge-text">
          {selectedDate && selectedTime
            ? `${formatDateKoreanFull(selectedDate)} · ${selectedTime}`
            : "날짜와 시간을 선택해 주세요"}
        </Text>
      </View>
    </>
  );
}
