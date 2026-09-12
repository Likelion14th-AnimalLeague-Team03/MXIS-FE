import { type ReactNode } from "react";
import { Image, Text, View } from "react-native";

import outIcon from "@/features/care/assets/out.png";
import popIcon from "@/features/care/assets/pop.png";
import temperatureIcon from "@/features/care/assets/temperature.png";
import waterIcon from "@/features/care/assets/water.png";
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
        icon={
          <Image
            source={temperatureIcon}
            className="size-[18px]"
            resizeMode="contain"
          />
        }
        label="평균 온도"
        value={
          period?.avgTemperature != null
            ? `${Math.round(period.avgTemperature)}°C`
            : "수집중"
        }
        muted={period?.avgTemperature == null}
      />
      <StatTile
        icon={
          <Image
            source={waterIcon}
            className="size-[18px]"
            resizeMode="contain"
          />
        }
        label="평균 습도"
        value={
          period?.avgHumidity != null
            ? `${Math.round(period.avgHumidity)}%`
            : "수집중"
        }
        muted={period?.avgHumidity == null}
      />
      <StatTile
        icon={
          <Image source={outIcon} className="size-[18px]" resizeMode="contain" />
        }
        label="외출"
        value={period?.outingCount != null ? `${period.outingCount}회` : "수집중"}
        muted={period?.outingCount == null}
      />
      <StatTile
        icon={
          <Image source={popIcon} className="size-[18px]" resizeMode="contain" />
        }
        label="충격"
        value={period?.shockCount != null ? `${period.shockCount}회` : "수집중"}
        muted={period?.shockCount == null}
      />
    </View>
  );
}
