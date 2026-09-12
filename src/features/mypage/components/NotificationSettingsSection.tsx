import { Switch, Text, View } from "react-native";

import { AccordionSectionHeader } from "@/features/mypage/components/AccordionSectionHeader";
import {
  EXPANDED_SECTION_BACKGROUND,
  NOTIFICATION_ITEMS,
  type NotificationSettingKey,
} from "@/features/mypage/constants";
import type { NotificationSetting } from "@/features/mypage/types";

export function NotificationSettingsSection({
  expanded,
  isUpdating,
  onToggle,
  onToggleSetting,
  permissionMessage,
  settings,
  settingsError,
  updateError,
}: {
  expanded: boolean;
  isUpdating: boolean;
  onToggle: () => void;
  onToggleSetting: (key: NotificationSettingKey, value: boolean) => void;
  permissionMessage: string | null;
  settings?: NotificationSetting;
  settingsError: string | null;
  updateError: string | null;
}) {
  return (
    <>
      <AccordionSectionHeader
        expanded={expanded}
        label="알림 설정"
        onPress={onToggle}
      />
      {expanded ? (
        <View
          className="mb-3 mt-1 gap-4 rounded-xl px-4 py-4"
          style={{ backgroundColor: EXPANDED_SECTION_BACKGROUND }}
        >
          {NOTIFICATION_ITEMS.map((item) => (
            <View
              key={item.key}
              className="flex-row items-center justify-between"
            >
              <Text className="flex-1 pr-3 text-sm text-concierge-text">
                {item.label}
              </Text>
              <Switch
                value={settings?.[item.key] ?? false}
                disabled={!settings || isUpdating}
                onValueChange={(value) => onToggleSetting(item.key, value)}
                trackColor={{ false: "#898989", true: "#4EC576" }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
          {permissionMessage ? (
            <Text className="text-xs text-[#C04737]">{permissionMessage}</Text>
          ) : null}
          {settingsError ? (
            <Text className="text-xs text-[#C04737]">{settingsError}</Text>
          ) : null}
          {updateError ? (
            <Text className="text-xs text-[#C04737]">{updateError}</Text>
          ) : null}
        </View>
      ) : null}
      <View className="border-t border-concierge-borderLight" />
    </>
  );
}
