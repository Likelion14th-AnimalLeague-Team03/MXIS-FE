import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

import type {
  CharmConnectionStatus,
  ScannedCharmDevice,
} from "@/features/onboarding/types";
import { SecondaryButton } from "@/shared/components/SecondaryButton";

function StatusPill({
  status,
}: {
  status: Exclude<CharmConnectionStatus, "idle">;
}) {
  const isFailed =
    status === "ble-failed" ||
    status === "setup-failed" ||
    status === "server-failed";
  const color = isFailed ? "#A51F21" : "#814C27";
  const label = isFailed ? "연결 실패" : "연결 중";

  return (
    <View
      className="min-h-6 shrink-0 items-center justify-center rounded-full border px-2 py-0.5"
      style={{ borderColor: color }}
    >
      <Text className="text-[10px] font-medium" style={{ color, lineHeight: 16 }}>
        {label}
      </Text>
    </View>
  );
}

export function CharmDeviceCard({
  device,
  onPress,
  disabled,
  isLast,
}: {
  device: ScannedCharmDevice;
  onPress: (device: ScannedCharmDevice) => void;
  disabled: boolean;
  isLast: boolean;
}) {
  const isFailed =
    device.status === "ble-failed" ||
    device.status === "setup-failed" ||
    device.status === "server-failed";
  const visibleStatus = device.status === "idle" ? null : device.status;
  const dotColor = isFailed
    ? "#A51F21"
    : device.status !== "idle"
      ? "#E4AB7C"
      : "#898989";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => onPress(device)}
      className={`min-h-[56px] flex-row items-center gap-2.5 px-4 py-2.5 ${isLast ? "" : "border-b border-concierge-border"}`}
    >
      <View
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: dotColor }}
      />

      <View className="min-w-0 flex-1">
        <Text
          className="text-sm font-semibold text-concierge-text"
          numberOfLines={1}
        >
          {device.serialNumber}
        </Text>
      </View>

      {visibleStatus ? <StatusPill status={visibleStatus} /> : null}
    </Pressable>
  );
}

export function SearchBottomActions({
  onSearchAgain,
  disabled,
}: {
  onSearchAgain: () => void;
  disabled: boolean;
}) {
  return (
    <View className="gap-2">
      <SecondaryButton
        label="다시 검색"
        onPress={onSearchAgain}
        disabled={disabled}
      />
      <Link href="/onboarding/connection-help" asChild>
        <Pressable
          hitSlop={12}
          className="min-h-[32px] items-center justify-center"
        >
          <Text className="text-center text-sm font-medium text-concierge-textSecondary">
            MXIS Charm을 찾지 못하셨나요? 연결 도움말
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}
