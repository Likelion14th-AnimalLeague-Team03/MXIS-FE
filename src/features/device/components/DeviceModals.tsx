import { Image, Modal, Pressable, Text, View } from "react-native";

import type { DisplayCharm } from "@/features/device/types";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { SecondaryButton } from "@/shared/components/SecondaryButton";

export function CharmImageModal({
  charm,
  onClose,
}: {
  charm: DisplayCharm | null;
  onClose: () => void;
}) {
  return (
    <Modal
      transparent
      visible={charm !== null}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="참 이미지 닫기"
        onPress={onClose}
        className="flex-1 items-center justify-center bg-black/55 px-6"
      >
        <View className="w-full max-w-[300px] items-center rounded-[20px] bg-white px-6 py-7">
          {charm?.image ? (
            <Image
              source={charm.image}
              resizeMode="contain"
              style={{ height: 240, width: 240 }}
            />
          ) : (
            <View className="h-[240px] w-[240px] items-center justify-center">
              <Text className="text-[13px] font-medium text-[#898989]">
                이미지가 없습니다.
              </Text>
            </View>
          )}
          {charm ? (
            <Text className="mt-4 text-[16px] font-semibold text-[#121212]">
              {charm.serialNumber}
            </Text>
          ) : null}
          <Text className="mt-2 text-[12px] font-medium text-[#898989]">
            화면을 누르면 닫혀요
          </Text>
        </View>
      </Pressable>
    </Modal>
  );
}

export function ConfirmModal({
  visible,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  isPending,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 items-center justify-center bg-black/35 px-6">
        <View className="w-full max-w-[342px] rounded-[16px] bg-[#FAF6F1] px-5 pb-[18px] pt-[22px]">
          <Text className="text-[20px] font-semibold text-[#121212]">
            {title}
          </Text>
          <Text className="mt-[14px] text-[14px] font-medium leading-5 text-[#63635E]">
            {body}
          </Text>
          <PrimaryButton
            label={isPending ? "처리 중입니다" : confirmLabel}
            onPress={onConfirm}
            disabled={isPending}
            className="mt-[18px] h-[48px] rounded-[8px]"
          />
          <SecondaryButton
            label="취소"
            onPress={onCancel}
            className="mt-[10px] h-[48px] rounded-[8px]"
          />
          <Text className="mt-[12px] text-center text-[12px] font-medium text-[#898989]">
            기존 기록은 삭제되지 않습니다.
          </Text>
        </View>
      </View>
    </Modal>
  );
}
