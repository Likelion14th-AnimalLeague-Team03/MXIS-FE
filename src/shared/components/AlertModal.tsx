import { Modal, Pressable, Text, View } from "react-native";

type ModalAction = {
  label: string;
  onPress: () => void;
  variant?: "default" | "accent";
};

type Props = {
  visible: boolean;
  title: string;
  description?: string;
  actions: ModalAction[];
  layout?: "row" | "column";
  onRequestClose?: () => void;
};

const DARK_CARD_BG = "#2B211C";

export function AlertModal({ visible, title, description, actions, layout = "row", onRequestClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <View className="flex-1 items-center justify-center bg-black/50 px-8">
        <View className="w-full rounded-2xl px-5 py-6" style={{ backgroundColor: DARK_CARD_BG }}>
          <Text className="text-center text-base font-bold text-white">{title}</Text>
          {description ? (
            <Text className="mt-2 text-center text-[13px] leading-5 text-white/60">{description}</Text>
          ) : null}
          <View
            className={
              layout === "row"
                ? "mt-5 flex-row border-t border-white/10 pt-3"
                : "mt-5 gap-1 border-t border-white/10 pt-3"
            }
          >
            {actions.map((action, index) => (
              <Pressable
                key={action.label}
                onPress={action.onPress}
                className={
                  layout === "row"
                    ? `flex-1 items-center py-1 ${index > 0 ? "border-l border-white/10" : ""}`
                    : "items-center py-2"
                }
              >
                <Text
                  className={`text-sm font-semibold ${
                    action.variant === "accent" ? "text-concierge-accent" : "text-white/70"
                  }`}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
