import { Text, View } from "react-native";

import { AccordionSectionHeader } from "@/features/mypage/components/AccordionSectionHeader";
import { EXPANDED_SECTION_BACKGROUND } from "@/features/mypage/constants";

function InfoRow({
  label,
  value,
  bordered,
}: {
  label: string;
  value: string;
  bordered?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between px-4 py-3 ${
        bordered ? "border-t border-white/60" : ""
      }`}
    >
      <Text className="text-sm text-concierge-textSecondary">{label}</Text>
      <Text className="text-sm text-concierge-text">{value}</Text>
    </View>
  );
}

export function ProfileInfoSection({
  email,
  expanded,
  name,
  onToggle,
  phone,
  profileError,
}: {
  email: string;
  expanded: boolean;
  name: string;
  onToggle: () => void;
  phone: string;
  profileError: string | null;
}) {
  return (
    <>
      <AccordionSectionHeader
        expanded={expanded}
        label="내 정보 확인"
        onPress={onToggle}
      />
      {expanded ? (
        <View
          className="mb-3 mt-1 gap-px overflow-hidden rounded-xl"
          style={{ backgroundColor: EXPANDED_SECTION_BACKGROUND }}
        >
          <InfoRow label="이름" value={name} />
          <InfoRow label="이메일" value={email} bordered />
          <InfoRow label="전화번호" value={phone} bordered />
          {profileError ? (
            <View className="border-t border-white/60 px-4 py-3">
              <Text className="text-xs text-[#C04737]">{profileError}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      <View className="border-t border-concierge-borderLight" />
    </>
  );
}
