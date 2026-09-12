import { Image, Text, View, type ImageSourcePropType } from "react-native";

import cautionImage from "@/features/care/assets/caution.png";
import dangerImage from "@/features/care/assets/danger.png";
import reportImage from "@/features/care/assets/report.png";
import safeImage from "@/features/care/assets/safe.png";
import temperatureIcon from "@/features/care/assets/temperature.png";
import waterIcon from "@/features/care/assets/water.png";
import type { CareLevel } from "@/features/care/status";
import { ShadowCard } from "@/shared/components/ShadowCard";

const CONDITION_IMAGE: Record<CareLevel, ImageSourcePropType> = {
  PENDING: reportImage,
  SAFE: safeImage,
  CAUTION: cautionImage,
  DANGER: dangerImage,
};

const METRIC_STYLE: Record<
  CareLevel,
  { label: string; textColor: string; fill?: string }
> = {
  PENDING: { label: "수집중", textColor: "#63635E" },
  SAFE: { label: "안정", textColor: "#2D5109" },
  CAUTION: { label: "주의", textColor: "#A94900", fill: "#FBC45E" },
  DANGER: { label: "위험", textColor: "#A51F21", fill: "#F0C9C5" },
};

const CONDITION_FALLBACK_ASPECT_RATIO = 351 / 171;

function resolveConditionAspectRatio(image: ImageSourcePropType) {
  const asset = Image.resolveAssetSource(image);

  if (!asset?.width || !asset?.height) {
    return CONDITION_FALLBACK_ASPECT_RATIO;
  }

  return asset.width / asset.height;
}

function MetricHalf({
  icon,
  label,
  level,
}: {
  icon: ImageSourcePropType;
  label: string;
  level: CareLevel;
}) {
  const style = METRIC_STYLE[level];

  return (
    <View
      className="flex-1 flex-row items-center pl-8"
      style={style.fill ? { backgroundColor: style.fill } : undefined}
    >
      <Image source={icon} className="size-[20px]" resizeMode="contain" />
      <View className="ml-2.5">
        <Text
          className="text-[11px] font-bold text-black"
          style={{ lineHeight: 15 }}
        >
          {label}
        </Text>
        <Text
          className="text-[20px] font-bold"
          style={{ color: style.textColor, lineHeight: 28 }}
        >
          {style.label}
        </Text>
      </View>
    </View>
  );
}

export function MetricStatusBar({
  temperatureLevel,
  humidityLevel,
}: {
  temperatureLevel: CareLevel;
  humidityLevel: CareLevel;
}) {
  return (
    <ShadowCard
      className="mt-7"
      radius={6}
      contentClassName="h-[59px] flex-row border border-concierge-primary bg-white"
    >
      <MetricHalf
        icon={temperatureIcon}
        label="온도"
        level={temperatureLevel}
      />
      <View className="w-px bg-concierge-border" />
      <MetricHalf icon={waterIcon} label="습도" level={humidityLevel} />
    </ShadowCard>
  );
}

export function ConditionCard({
  level,
  summary,
  detail,
}: {
  level: CareLevel;
  summary: string;
  detail: string;
}) {
  const image = CONDITION_IMAGE[level];

  return (
    <Image
      source={image}
      resizeMode="contain"
      className="-mx-1 mt-3 self-stretch"
      style={{ aspectRatio: resolveConditionAspectRatio(image) }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`현재 컨디션. ${summary} ${detail}`}
    />
  );
}
