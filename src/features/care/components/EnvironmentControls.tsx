import { Pressable, Text, View } from "react-native";

import {
  ENVIRONMENT_RANGES,
  type EnvironmentMetric,
  type EnvironmentRange,
} from "@/features/care/utils/environmentPresentation";

const RANGE_TAB_BAR = {
  height: 33,
  backgroundColor: "#814C27",
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 2,
  elevation: 2,
} as const;

const METRIC_TOGGLE_SHADOW = {
  shadowColor: "#1D212D",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.16,
  shadowRadius: 2,
  elevation: 2,
} as const;

export function EnvironmentRangeTabs({
  range,
  onSelect,
}: {
  range: EnvironmentRange;
  onSelect: (range: EnvironmentRange) => void;
}) {
  return (
    <View className="-mx-6 mt-4 flex-row" style={RANGE_TAB_BAR}>
      {ENVIRONMENT_RANGES.map((label) => {
        const selected = range === label;

        return (
          <Pressable
            key={label}
            onPress={() => onSelect(label)}
            className="flex-1 items-center justify-center"
          >
            <Text
              className={`text-sm ${selected ? "text-white" : "text-white/70"}`}
              style={{ lineHeight: 20 }}
            >
              {label}
            </Text>
            {selected ? (
              <View className="absolute bottom-0 h-0.5 w-16 rounded-full bg-white" />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function EnvironmentMetricToggle({
  metric,
  onSelect,
}: {
  metric: EnvironmentMetric;
  onSelect: (metric: EnvironmentMetric) => void;
}) {
  const options: EnvironmentMetric[] = ["TEMP", "HUMIDITY"];

  return (
    <View className="h-8 w-[84px] flex-row rounded-lg bg-concierge-surfaceMuted p-0.5">
      {options.map((option) => {
        const selected = metric === option;

        return (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            className={`h-7 flex-1 items-center justify-center rounded-md ${
              selected ? "bg-concierge-primary" : ""
            }`}
            style={selected ? METRIC_TOGGLE_SHADOW : undefined}
          >
            <Text
              className={`text-[13px] ${
                selected ? "font-semibold text-white" : "text-concierge-text"
              }`}
            >
              {option === "TEMP" ? "온도" : "습도"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
