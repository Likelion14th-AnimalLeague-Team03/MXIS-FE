import { type ReactNode } from "react";
import { Image, Pressable, Text, View } from "react-native";

import outIcon from "@/features/care/assets/out.png";
import popIcon from "@/features/care/assets/pop.png";
import temperatureIcon from "@/features/care/assets/temperature.png";
import waterIcon from "@/features/care/assets/water.png";
import { CARE_CARD_SHADOW } from "@/features/care/styles";
import type { Environment30d } from "@/features/care/types";
import { Card } from "@/shared/components/Card";
import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";

function StatCard({
  icon,
  label,
  caption,
  value,
  muted = false,
}: {
  icon: ReactNode;
  label: string;
  caption?: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <Card
      className="w-[47%] border-0 bg-white px-3 py-3"
      style={CARE_CARD_SHADOW}
    >
      <View className="flex-row items-start gap-1.5">
        {icon}
        <View className="min-w-0 flex-1">
          <Text className="text-base font-semibold text-concierge-text">
            {label}
          </Text>
          {caption ? (
            <Text className="mt-0.5 text-[8px] text-concierge-textMuted">
              {caption}
            </Text>
          ) : null}
          <Text
            className={
              muted
                ? "mt-3 text-base font-semibold text-concierge-accentMuted"
                : "mt-3 text-2xl font-bold text-concierge-text"
            }
          >
            {value}
          </Text>
        </View>
      </View>
    </Card>
  );
}

export function CareEnvironmentSummary({
  environment,
  hasData,
  onOpen,
}: {
  environment?: Environment30d | null;
  hasData: boolean;
  onOpen: () => void;
}) {
  return (
    <>
      <Pressable
        onPress={onOpen}
        className="mx-2 mt-6 flex-row items-center justify-between"
      >
        <View>
          <Text className="text-2xl font-semibold text-concierge-text">
            환경 요약
          </Text>
          <Text className="mt-1 text-[13px] text-concierge-textMuted">
            {hasData
              ? "최근 30일 동안의 평균이에요"
              : "데이터가 충분히 쌓이면 확인할 수 있어요"}
          </Text>
        </View>
        <ChevronRightIcon size={9} />
      </Pressable>

      <View className="mt-3 flex-row flex-wrap justify-between gap-y-3">
        <StatCard
          icon={
            <Image
              source={temperatureIcon}
              className="mt-1.5 size-[18px]"
              resizeMode="contain"
            />
          }
          label="온도"
          caption={environment?.temperatureDescription ?? undefined}
          value={
            environment?.avgTemperature != null
              ? `${Math.round(environment.avgTemperature)}℃`
              : "-℃"
          }
          muted={environment?.avgTemperature == null}
        />
        <StatCard
          icon={
            <Image
              source={waterIcon}
              className="mt-1.5 size-[18px]"
              resizeMode="contain"
            />
          }
          label="습도"
          caption={environment?.humidityDescription ?? undefined}
          value={
            environment?.avgHumidity != null
              ? `${Math.round(environment.avgHumidity)} %`
              : "- %"
          }
          muted={environment?.avgHumidity == null}
        />
        <StatCard
          icon={
            <Image
              source={popIcon}
              className="mt-1.5 size-[18px]"
              resizeMode="contain"
            />
          }
          label="충격"
          value={environment?.shockLevelLabel ?? "수집중"}
          muted={!environment?.shockLevelLabel}
        />
        <StatCard
          icon={
            <Image
              source={outIcon}
              className="mt-1.5 size-[18px]"
              resizeMode="contain"
            />
          }
          label="최근 이동"
          value={
            environment?.outingCount != null
              ? `${environment.outingCount}회`
              : "수집중"
          }
          muted={environment?.outingCount == null}
        />
      </View>
    </>
  );
}
