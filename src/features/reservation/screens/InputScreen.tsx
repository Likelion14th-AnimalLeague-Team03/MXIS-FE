import { useRouter } from "expo-router";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import productPhoto from "@/features/reservation/assets/product-mcm-aren-shopper.png";
import { formatDateShort } from "@/features/reservation/format";
import { useReservationStore } from "@/features/reservation/store";
import { Card } from "@/shared/components/Card";
import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";
import { WarningIcon } from "@/shared/components/icons/WarningIcon";
import { PrimaryButton } from "@/shared/components/PrimaryButton";

function SelectRow({
  label,
  value,
  placeholder,
  onPress,
  disabled = false,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      className={`flex-row items-center justify-between px-4 py-4 ${disabled ? "opacity-40" : ""}`}
    >
      <View className="flex-1 pr-3">
        <Text className="text-xs text-concierge-textMuted">{label}</Text>
        <Text
          className={
            value
              ? "mt-1 text-sm font-semibold text-concierge-text"
              : "mt-1 text-sm text-concierge-textMuted"
          }
        >
          {value ?? placeholder}
        </Text>
      </View>
      <ChevronRightIcon />
    </Pressable>
  );
}

export function InputScreen() {
  const router = useRouter();
  const draft = useReservationStore((state) => state.draft);
  const setDraftNote = useReservationStore((state) => state.setDraftNote);
  const confirmDraft = useReservationStore((state) => state.confirmDraft);

  const canSubmit = Boolean(draft.storeName && draft.date && draft.time);

  const handleSubmit = () => {
    if (!canSubmit) return;
    confirmDraft();
    router.replace("/reservation/complete");
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <Text className="px-6 pt-4 text-xl font-bold text-concierge-text">
        케어 컨시어지 예약
      </Text>

      <ScrollView
        className="flex-1 px-6"
        contentContainerClassName="pb-4"
        keyboardShouldPersistTaps="handled"
      >
        <Card className="mt-4 flex-row items-center gap-3 border-0 bg-concierge-surfaceMuted px-4 py-4">
          <Image
            source={productPhoto}
            className="size-[78px] rounded-2xl"
            resizeMode="cover"
          />
          <View>
            <Text className="text-base font-semibold text-[#121212]">
              MCM Aren Shopper
            </Text>
            <Text className="mt-1 text-[13px] text-[#63635E]">
              Visetos Canvas · Cognac
            </Text>
            <Text className="mt-1 text-[13px] font-medium text-[#121212]">
              함께한 외출 50회
            </Text>
          </View>
        </Card>

        <Card className="mt-4 bg-white">
          <SelectRow
            label="방문 매장"
            value={draft.storeName}
            placeholder="매장을 선택해 주세요"
            onPress={() => router.push("/reservation/store")}
          />
          <View className="border-t border-concierge-borderLight" />
        </Card>
        <Card className="bg-white mt-4">
          <SelectRow
            label="방문 일정"
            value={
              draft.date && draft.time
                ? `${formatDateShort(draft.date)} · ${draft.time}`
                : null
            }
            placeholder={
              draft.storeName
                ? "날짜와 시간을 선택해 주세요"
                : "매장을 먼저 선택해 주세요"
            }
            onPress={() => router.push("/reservation/datetime")}
            disabled={!draft.storeName}
          />
        </Card>

        <Card className="mt-4 bg-white px-4 py-4">
          <Text className="text-base font-bold text-concierge-text">
            요청사항
          </Text>
          <Text className="mt-2 text-xs text-concierge-textMuted">
            제품 상태나 방문 전 전달할 내용을 입력해 주세요.
          </Text>
          <TextInput
            value={draft.note}
            onChangeText={setDraftNote}
            multiline
            maxLength={300}
            placeholder=""
            className="mt-3 h-24 rounded-xl border border-concierge-borderLight px-3 py-2 text-sm text-concierge-text"
            textAlignVertical="top"
          />
          <Text className="mt-1 self-end text-xs text-concierge-textMuted">
            {draft.note.length}/300
          </Text>
        </Card>

        <View className="border border-[#E9DDD2] rounded-[10px] mt-5 p-5">
          <View className=" flex-row items-center  gap-1.5">
            <WarningIcon />
            <Text className="text-sm font-bold text-concierge-text">
              예약 안내
            </Text>
          </View>
          <Text className="mt-2 text-xs leading-5 text-concierge-textMuted">
            선택한 매장과 시간의 가능 여부를 확인한 뒤 예약이 확정됩니다.
          </Text>
        </View>
      </ScrollView>

      <View className="px-6 pb-4 pt-2">
        <PrimaryButton
          label="예약 요청하기"
          onPress={handleSubmit}
          disabled={!canSubmit}
        />
      </View>
    </SafeAreaView>
  );
}
