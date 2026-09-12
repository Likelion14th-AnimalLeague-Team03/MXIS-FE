import { Pressable, Text, View } from "react-native";

import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";

export function AccordionSectionHeader({
  expanded,
  label,
  onPress,
}: {
  expanded: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between py-2"
    >
      <Text className="text-sm text-concierge-textSecondary">{label}</Text>
      <View
        style={{
          transform: [{ rotate: expanded ? "-90deg" : "90deg" }],
        }}
      >
        <ChevronRightIcon size={6} color="#63635E" />
      </View>
    </Pressable>
  );
}
