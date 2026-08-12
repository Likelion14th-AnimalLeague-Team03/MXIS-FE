import { Pressable, Text } from "react-native";

type Props = {
  label: string;
  onPress: () => void;
  className?: string;
};

export function SecondaryButton({ label, onPress, className }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className={`items-center justify-center rounded-xl border border-concierge-border bg-white px-4 py-[13px] ${className ?? ""}`}
    >
      <Text className="text-base font-semibold text-concierge-text">{label}</Text>
    </Pressable>
  );
}
