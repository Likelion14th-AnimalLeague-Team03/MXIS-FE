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
  /** row: 구분선으로 나뉜 텍스트 버튼을 가로로 배치 (예: 예약 취소 확인) */
  /** column: 꽉 찬 필/아웃라인 버튼을 세로로 배치 (예: 위치 권한 동의, 완료 안내) */
  layout?: "row" | "column";
  onRequestClose?: () => void;
};

const CARD_BG = "#FAF6F1";

export function AlertModal({
  visible,
  title,
  description,
  actions,
  layout = "row",
  onRequestClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-8">
        <View
          className="w-full rounded-2xl px-7 pt-6"
          style={{ backgroundColor: CARD_BG }}
        >
          <Text className="text-base font-bold text-black">{title}</Text>
          {description ? (
            <Text className="mt-2 text-[13px] leading-5 text-concierge-primary">
              {description}
            </Text>
          ) : null}

          {layout === "column" ? (
            <View className="mb-6 mt-5 gap-2">
              {actions.map((action) => (
                <Pressable
                  key={action.label}
                  onPress={action.onPress}
                  className={`items-center justify-center rounded-xl px-4 py-[13px] ${
                    action.variant === "accent"
                      ? "bg-concierge-primary"
                      : "border border-concierge-border bg-white"
                  }`}
                >
                  <Text
                    className={`text-base font-semibold ${
                      action.variant === "accent"
                        ? "text-white"
                        : "text-concierge-primary"
                    }`}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View className="-mx-5 mt-5 flex-row border-t border-concierge-borderLight">
              {actions.map((action, index) => (
                <Pressable
                  key={action.label}
                  onPress={action.onPress}
                  className={`flex-1 items-center py-3.5 ${
                    index > 0 ? "border-l border-concierge-borderLight" : ""
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      action.variant === "accent"
                        ? "text-concierge-primary"
                        : "text-concierge-text"
                    }`}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
