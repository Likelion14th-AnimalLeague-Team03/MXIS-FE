import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { RESERVATION_WEEKDAY_LABELS } from "@/features/reservation/constants";
import {
  getCalendarWeeks,
  isSameCalendarDay,
} from "@/features/reservation/utils/calendar";

export function ReservationCalendar({
  onChangeMonth,
  onSelectDate,
  selectedDate,
  today,
  visibleMonth,
}: {
  onChangeMonth: (offset: number) => void;
  onSelectDate: (date: Date) => void;
  selectedDate: Date | null;
  today: Date;
  visibleMonth: Date;
}) {
  const weeks = useMemo(() => getCalendarWeeks(visibleMonth), [visibleMonth]);

  return (
    <View className="mt-4 rounded-xl border border-concierge-border bg-white px-4 py-3">
      <View className="flex-row items-center ">
        <Text className="text-[15px] font-bold text-concierge-text">
          {visibleMonth.getFullYear()}년 {visibleMonth.getMonth() + 1}월
        </Text>
        <View className="flex-row  ml-3 gap-4">
          <Pressable onPress={() => onChangeMonth(-1)} hitSlop={8}>
            <Text className="text-lg font-medium text-concierge-textSecondary">
              ‹
            </Text>
          </Pressable>
          <Pressable onPress={() => onChangeMonth(1)} hitSlop={8}>
            <Text className="text-lg font-medium text-concierge-textSecondary">
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
            if (!date) {
              return <View key={dayIndex} className="h-[34px] w-[14.28%]" />;
            }

            const disabled = date.getTime() < today.getTime();
            const selected = selectedDate
              ? isSameCalendarDay(date, selectedDate)
              : false;

            return (
              <View key={dayIndex} className="w-[14.28%] items-center py-0.5">
                <Pressable
                  disabled={disabled}
                  onPress={() => onSelectDate(date)}
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
  );
}
