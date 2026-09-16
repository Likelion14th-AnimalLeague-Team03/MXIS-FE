import { Text, View } from "react-native";

import type { ProductDeviceManagementSummary } from "@/features/device/types";
import type { DeviceProduct, DisplayCharm } from "@/features/device/types";
import {
  formatBatteryLabel,
  formatHumidity,
  formatTemperature,
  isSameProductSummary,
} from "@/features/device/utils/deviceDisplay";
import { BatteryIcon } from "@/shared/components/icons/BatteryIcon";
import { InfoIcon } from "@/shared/components/icons/InfoIcon";

type DeviceStatusSectionProps = {
  product: DeviceProduct | null;
  productSummary: ProductDeviceManagementSummary | null;
  connectedCharm: DisplayCharm | null;
  hasConnectedCharm: boolean;
  lastSyncedLabel: string;
};

export function DeviceStatusSection({
  product,
  productSummary,
  connectedCharm,
  hasConnectedCharm,
  lastSyncedLabel,
}: DeviceStatusSectionProps) {
  return (
    <>
      <Text className="mt-[26px] text-[18px] font-bold text-[#171717]">
        세부 기기관리
      </Text>

      <View className="mt-2 rounded-[12px] border border-[#E4E1DD] bg-white px-4 py-3">
        <Text className="text-[14px] font-medium text-[#222222]">
          현재 보관 환경
        </Text>

        <View className="mt-3 flex-row items-center">
          <View className="flex-1 items-center">
            <Text className="text-[20px] font-semibold text-[#171717]">
              {formatTemperature(product, productSummary, hasConnectedCharm)}
            </Text>
            <Text className="text-[11px] text-[#686868]">온도</Text>
          </View>
          <View className="h-10 w-px bg-[#E4E1DD]" />
          <View className="flex-1 items-center">
            <Text className="text-[20px] font-semibold text-[#171717]">
              {formatHumidity(product, productSummary, hasConnectedCharm)}
            </Text>
            <Text className="text-[11px] text-[#686868]">습도</Text>
          </View>
        </View>

        <View className="mt-3 h-px bg-[#E4E1DD]" />
        <Text className="mt-[5px] text-[12px] font-medium text-[#686868]">
          {isSameProductSummary(product, productSummary) && hasConnectedCharm
            ? "마지막으로 저장된 측정값이에요"
            : "데이터가 없어요"}
        </Text>
      </View>

      <View className="mt-[18px] overflow-hidden rounded-[12px] border border-[#E4E1DD] bg-white px-4">
        <View className="flex-row items-center justify-between py-[9px]">
          <View className="flex-row items-center gap-3">
            <BatteryIcon size={17} />
            <Text className="text-[14px] font-medium text-[#262626]">
              배터리 상태
            </Text>
          </View>
          <Text className="text-[14px] font-medium text-[#262626]">
            {hasConnectedCharm ? formatBatteryLabel(connectedCharm) : "-%"}
          </Text>
        </View>
        <View className="h-px bg-[#E4E1DD]" />
        <View className="flex-row items-center justify-between py-[9px]">
          <View className="flex-row items-center gap-3">
            <InfoIcon size={15} />
            <Text className="text-[14px] font-medium text-[#262626]">
              마지막 연동
            </Text>
          </View>
          <Text className="text-[14px] font-medium text-[#676767]">
            {lastSyncedLabel}
          </Text>
        </View>
      </View>

    </>
  );
}
