import { Pressable, Text } from "react-native";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  className?: string;
};

export function PrimaryButton({ label, onPress, disabled, className }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`items-center justify-center rounded-xl bg-concierge-primary px-4 py-[13px] ${disabled ? "opacity-50" : ""} ${className ?? ""}`}
    >
      <Text className="text-base font-semibold text-white">{label}</Text>
    </Pressable>
  );
}
