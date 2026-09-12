import { Pressable, Switch, Text, View } from "react-native";

import { AccordionSectionHeader } from "@/features/mypage/components/AccordionSectionHeader";
import {
  EXPANDED_SECTION_BACKGROUND,
  TERMS_SECTIONS,
  type MyPageSectionKey,
  type TermsSectionKey,
} from "@/features/mypage/constants";
import type { ConsentStatus, ConsentType } from "@/features/mypage/types";

export function TermsSections({
  consents,
  isUpdating,
  onToggleConsent,
  onToggleSection,
  openKey,
  updateError,
}: {
  consents?: ConsentStatus[];
  isUpdating: boolean;
  onToggleConsent: (consentType: ConsentType, agreed: boolean) => void;
  onToggleSection: (key: TermsSectionKey) => void;
  openKey: MyPageSectionKey | null;
  updateError: string | null;
}) {
  return TERMS_SECTIONS.map((section, index) => {
    const consent = section.consentType
      ? consents?.find((item) => item.consentType === section.consentType)
      : undefined;
    const expanded = openKey === section.key;

    return (
      <View key={section.key}>
        <AccordionSectionHeader
          expanded={expanded}
          label={section.label}
          onPress={() => onToggleSection(section.key)}
        />
        {expanded ? (
          <View
            className="mb-3 mt-1 gap-3 rounded-xl px-4 py-4"
          style={{ backgroundColor: EXPANDED_SECTION_BACKGROUND }}
          >
            <Text className="text-xs text-concierge-textMuted">
              {section.meta}
            </Text>
            <Text className="text-sm text-concierge-text">
              {section.description}
            </Text>
            {section.groups.map((group) => (
              <View key={group.heading}>
                <Text className="text-sm font-semibold text-concierge-text">
                  {group.heading}
                </Text>
                <Text className="mt-1 text-sm text-concierge-textSecondary">
                  {group.content}
                </Text>
              </View>
            ))}
            {section.togglable && section.consentType ? (
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-concierge-text">
                  동의하고 소식 받기
                </Text>
                <Switch
                  value={consent?.agreed ?? false}
                  disabled={isUpdating}
                  onValueChange={(value) =>
                    onToggleConsent(section.consentType!, value)
                  }
                  trackColor={{ false: "#898989", true: "#4EC576" }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ) : null}
            {section.linkLabel ? (
              <Pressable>
                <Text className="text-sm font-semibold text-concierge-primary">
                  {section.linkLabel}
                </Text>
              </Pressable>
            ) : null}
            {section.note ? (
              <Text className="text-xs text-concierge-textMuted">
                {section.note}
              </Text>
            ) : null}
            {updateError ? (
              <Text className="text-xs text-[#C04737]">{updateError}</Text>
            ) : null}
          </View>
        ) : null}
        {index < TERMS_SECTIONS.length - 1 ? (
          <View className="border-t border-concierge-borderLight" />
        ) : null}
      </View>
    );
  });
}
