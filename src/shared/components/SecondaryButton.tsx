import { Pressable, Text } from "react-native";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  className?: string;
};

export function SecondaryButton({ label, onPress, className, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      className={`items-center justify-center rounded-xl border border-concierge-border bg-white px-4 py-[13px] ${disabled ? "opacity-50" : ""} ${className ?? ""}`}
    >
      <Text className="text-base font-semibold text-concierge-text">{label}</Text>
    </Pressable>
  );
}
