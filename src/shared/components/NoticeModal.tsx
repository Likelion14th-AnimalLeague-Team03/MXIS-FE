import { Modal, Text, View } from "react-native";

import { PrimaryButton } from "@/shared/components/PrimaryButton";

type Props = {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
};

export function NoticeModal({
  visible,
  title,
  description,
  confirmLabel = "확인",
  onConfirm,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onConfirm}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-8">
        <View className="w-full rounded-2xl bg-concierge-bg px-7 pb-6 pt-6">
          <Text className=" text-base font-bold text-concierge-text">
            {title}
          </Text>
          {description ? (
            <Text className="mt-2 text-[13px] leading-5 text-concierge-textMuted">
              {description}
            </Text>
          ) : null}
          <PrimaryButton
            label={confirmLabel}
            onPress={onConfirm}
            className="mt-5"
          />
        </View>
      </View>
    </Modal>
  );
}
