import { type ReactNode } from "react";
import { Text, View } from "react-native";

import {
  CareHumidityIcon,
  CareShockIcon,
  CareTemperatureIcon,
  CareUsagePatternIcon,
} from "@/features/care/components/CareMetricIcons";
import type { PeriodEnvironment } from "@/features/care/types";

function StatTile({
  icon,
  label,
  value,
  muted = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <View className="w-[47%] flex-row items-center gap-3 rounded-2xl border border-concierge-borderLight bg-white px-4 py-4">
      <View>
        <Text className="text-xs text-concierge-textMuted">{label}</Text>
        <Text
          className={
            muted
              ? "mt-2 text-sm font-semibold text-concierge-textMuted"
              : "mt-2 text-lg font-bold text-concierge-text"
          }
        >
          {value}
        </Text>
      </View>
      <View className="ml-auto size-10 items-center justify-center rounded-full bg-concierge-surfaceMuted">
        {icon}
      </View>
    </View>
  );
}

export function EnvironmentStats({
  period,
}: {
  period: PeriodEnvironment | null;
}) {
  return (
    <View className="mt-4 flex-row flex-wrap justify-between gap-y-3">
      <StatTile
        icon={<CareTemperatureIcon size={18} />}
        label="평균 온도"
        value={
          period?.avgTemperature != null
            ? `${Math.round(period.avgTemperature)}°C`
            : "수집중"
        }
        muted={period?.avgTemperature == null}
      />
      <StatTile
        icon={<CareHumidityIcon size={18} />}
        label="평균 습도"
        value={
          period?.avgHumidity != null
            ? `${Math.round(period.avgHumidity)}%`
            : "수집중"
        }
        muted={period?.avgHumidity == null}
      />
      <StatTile
        icon={<CareUsagePatternIcon size={18} />}
        label="외출"
        value={period?.outingCount != null ? `${period.outingCount}회` : "수집중"}
        muted={period?.outingCount == null}
      />
      <StatTile
        icon={<CareShockIcon size={18} />}
        label="충격"
        value={period?.shockCount != null ? `${period.shockCount}회` : "수집중"}
        muted={period?.shockCount == null}
      />
    </View>
  );
}
