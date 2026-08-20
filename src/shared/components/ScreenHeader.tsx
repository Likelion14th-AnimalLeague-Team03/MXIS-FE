import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { BackChevronIcon } from "@/shared/components/icons/BackChevronIcon";

type Props = {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  className?: string;
  titleClassName?: string;
};

export function ScreenHeader({
  title,
  onBack,
  right,
  className,
  titleClassName,
}: Props) {
  return (
    <View className={`flex-row items-center gap-3 ${className ?? ""}`}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={12}>
          <BackChevronIcon />
        </Pressable>
      ) : null}
      <Text className={`${titleClassName ?? "text-xl"} font-bold text-concierge-text`}>
        {title}
      </Text>
      {right ? <View className="ml-auto">{right}</View> : null}
    </View>
  );
}
