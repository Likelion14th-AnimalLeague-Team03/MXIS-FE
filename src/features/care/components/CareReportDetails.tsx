import { type ReactNode } from "react";
import { Image, Pressable, Text, View } from "react-native";

import outIcon from "@/features/care/assets/out.png";
import popIcon from "@/features/care/assets/pop.png";
import temperatureIcon from "@/features/care/assets/temperature.png";
import waterIcon from "@/features/care/assets/water.png";
import type { Environment30d } from "@/features/care/types";
import { MISSING_VALUE } from "@/features/care/utils/careReportPresentation";
import { ShieldCheckIcon } from "@/shared/components/icons/ShieldIcon";
import { CARD_SHADOW, ShadowCard } from "@/shared/components/ShadowCard";

function SummaryRow({
  icon,
  label,
  caption,
  value,
  note,
  divider = true,
}: {
  icon: ReactNode;
  label: string;
  caption: string;
  value: string;
  note?: string | null;
  divider?: boolean;
}) {
  return (
    <>
      <View className="h-[62px] flex-row items-center gap-2 px-[18px]">
        {icon}
        <View className="min-w-0 flex-1">
          <Text
            className="text-sm font-medium text-concierge-text"
            style={{ lineHeight: 20 }}
          >
            {label}
          </Text>
          <Text
            className="text-xs text-concierge-textSecondary"
            style={{ lineHeight: 17 }}
          >
            {caption}
          </Text>
        </View>
        <View className="ml-2 max-w-[160px] items-end">
          <Text
            className="text-sm font-bold text-concierge-text"
            style={{ lineHeight: 20 }}
          >
            {value}
          </Text>
          {note ? (
            <Text
              className="text-xs text-concierge-textSecondary"
              style={{ lineHeight: 17 }}
              numberOfLines={1}
            >
              {note}
            </Text>
          ) : null}
        </View>
      </View>
      {divider ? (
        <View className="mx-[17px] border-t border-concierge-borderLight" />
      ) : null}
    </>
  );
}

function InterpretationCard({ description }: { description: string }) {
  return (
    <View
      className="mt-4 flex-row items-center gap-2.5 rounded-xl border border-concierge-border bg-white px-[15px] py-3"
      style={CARD_SHADOW}
    >
      <View className="size-[58px] items-center justify-center rounded-full bg-concierge-accent/30">
        <ShieldCheckIcon size={36} />
      </View>
      <View className="min-w-0 flex-1">
        <Text
          className="text-[13px] font-bold text-concierge-text"
          style={{ lineHeight: 18 }}
        >
          제품 상태 해석
        </Text>
        <Text
          className="mt-[5px] text-[13px] text-concierge-textSecondary"
          style={{ lineHeight: 18 }}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

function ReportLinkButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="h-12 flex-1 items-center justify-center rounded-[10px] border border-concierge-border bg-white"
    >
      <Text className="text-base font-bold text-concierge-text">{label}</Text>
    </Pressable>
  );
}

export function CareReportDetails({
  environment,
  hasHumidity,
  hasTemperature,
  humidityValue,
  interpretation,
  onOpenEnvironment,
  onOpenGuide,
  temperatureValue,
}: {
  environment?: Environment30d | null;
  hasHumidity: boolean;
  hasTemperature: boolean;
  humidityValue: string;
  interpretation: string;
  onOpenEnvironment: () => void;
  onOpenGuide: () => void;
  temperatureValue: string;
}) {
  return (
    <>
      <Text
        className="mt-12 text-xl font-bold text-concierge-text"
        style={{ lineHeight: 28 }}
      >
        케어 권장 상태
      </Text>
      <ShadowCard
        className="mt-4"
        contentClassName="border border-concierge-border bg-white"
      >
        <SummaryRow
          icon={
            <Image
              source={temperatureIcon}
              className="size-[20px]"
              resizeMode="contain"
            />
          }
          label="평균 온도"
          caption={hasTemperature ? "최근 30일 평균" : "데이터 수집 중"}
          value={temperatureValue}
          note={environment?.temperatureDescription}
        />
        <SummaryRow
          icon={
            <Image
              source={waterIcon}
              className="size-[18px]"
              resizeMode="contain"
            />
          }
          label="평균 습도"
          caption={hasHumidity ? "최근 30일 평균" : "데이터 수집 중"}
          value={humidityValue}
          note={environment?.humidityDescription}
        />
        <SummaryRow
          icon={
            <Image
              source={popIcon}
              className="size-[18px]"
              resizeMode="contain"
            />
          }
          label="충격"
          caption={environment?.shockLevelLabel ? "최근 30일" : "분석 전"}
          value={environment?.shockLevelLabel ?? MISSING_VALUE}
        />
        <SummaryRow
          icon={
            <Image
              source={outIcon}
              className="size-[20px]"
              resizeMode="contain"
            />
          }
          label="최근 사용 패턴"
          caption={
            environment?.outingCount != null ? "최근 30일 외출" : "분석 전"
          }
          value={
            environment?.outingCount != null
              ? `${environment.outingCount}회`
              : MISSING_VALUE
          }
          divider={false}
        />
      </ShadowCard>
      <InterpretationCard description={interpretation} />
      <View className="mt-14 flex-row gap-4">
        <ReportLinkButton label="환경 데이터" onPress={onOpenEnvironment} />
        <ReportLinkButton label="관리 가이드" onPress={onOpenGuide} />
      </View>
    </>
  );
}
