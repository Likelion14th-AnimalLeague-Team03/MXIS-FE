import { useRouter } from "expo-router";
import { type ReactNode } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  type ImageSourcePropType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import cautionImage from "@/features/care/assets/caution.png";
import dangerImage from "@/features/care/assets/danger.png";
import outIcon from "@/features/care/assets/out.png";
import popIcon from "@/features/care/assets/pop.png";
import reportImage from "@/features/care/assets/report.png";
import safeImage from "@/features/care/assets/safe.png";
import temperatureIcon from "@/features/care/assets/temperature.png";
import waterIcon from "@/features/care/assets/water.png";
import { useCareReport } from "@/features/care/hooks/useCare";
import {
  resolveConditionLevel,
  resolveHumidityLevel,
  resolveTemperatureLevel,
  type CareLevel,
} from "@/features/care/status";
import { usePrimaryProductId } from "@/features/product/hooks/useProduct";
import { formatDateDot } from "@/features/reservation/format";
import { useReservationStore } from "@/features/reservation/store";
import { type ReservationType } from "@/features/reservation/types";
import { parseLocalDate } from "@/shared/api/localTime";
import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";
import { ShieldCheckIcon } from "@/shared/components/icons/ShieldIcon";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { CARD_SHADOW, ShadowCard } from "@/shared/components/ShadowCard";

const MISSING_VALUE = "ㅡ";

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

/**
 * 상태 이미지를 못 읽었을 때 쓸 기본 비율 (디자인 351×171 기준).
 * 이미지가 재export되어 크기가 바뀌어도 런타임에서 실제 비율을 읽어 씁니다.
 */
const CONDITION_FALLBACK_ASPECT_RATIO = 351 / 171;

/**
 * 현재 컨디션 카드는 상태별 이미지(safe/caution/danger/report) 한 장을 그대로 씁니다.
 * 카드 테두리·그림자·문구가 모두 이미지에 포함돼 있어서 별도 카드 래퍼를 두지 않아요.
 */
function resolveConditionAspectRatio(image: ImageSourcePropType) {
  const asset = Image.resolveAssetSource(image);

  if (!asset?.width || !asset?.height) {
    return CONDITION_FALLBACK_ASPECT_RATIO;
  }

  return asset.width / asset.height;
}

/** 컨디션 등급은 아직 API에 없어서 요약 문구에서 추론합니다. */

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

function MetricStatusBar({
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

function ConditionCard({
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
      // 이미지에 카드 바깥 여백(그림자용 4px)이 포함돼 있어서, 좌우로 살짝 넓혀
      // 다른 카드들과 시각적 폭을 맞춥니다.
      className="-mx-1 mt-3 self-stretch"
      style={{ aspectRatio: resolveConditionAspectRatio(image) }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`현재 컨디션. ${summary} ${detail}`}
    />
  );
}

function CareRecommendCard({
  noticeLabel,
  title,
  onPressReserve,
}: {
  noticeLabel: string | null;
  title: string;
  onPressReserve: () => void;
}) {
  return (
    <ShadowCard
      className="mt-2"
      contentClassName={`border border-concierge-primary bg-white ${
        noticeLabel ? "pt-4" : "pt-[27px]"
      }`}
    >
      {noticeLabel ? (
        <Text
          className="px-[15px] text-xs font-medium text-concierge-textSecondary"
          style={{ lineHeight: 17 }}
        >
          {noticeLabel}
        </Text>
      ) : null}
      <Text
        className="px-[15px] pt-1 text-[15px] font-bold text-concierge-text"
        style={{ lineHeight: 21 }}
      >
        {title}
      </Text>

      <Pressable
        onPress={onPressReserve}
        className="mx-[7px] mb-[7px] mt-[14px] h-[37px] flex-row items-center justify-between rounded-[9px] bg-concierge-primary pl-2 pr-4"
      >
        <Text className="text-sm font-medium text-white">
          케어 예약 바로가기
        </Text>
        <ChevronRightIcon size={9} color="#FFFFFF" />
      </Pressable>
    </ShadowCard>
  );
}

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

export function ReportScreen() {
  const router = useRouter();
  const { productId } = usePrimaryProductId();
  const { data: report, isPending, error } = useCareReport(productId);
  const setPendingCareType = useReservationStore(
    (state) => state.setPendingCareType,
  );
  const resetDraft = useReservationStore((state) => state.resetDraft);

  const environment = report?.environment30d;

  const nextCareLabel = report?.nextCareRecommendedAt
    ? `${formatDateDot(parseLocalDate(report.nextCareRecommendedAt))} 이전`
    : report?.careCycleMonths != null
      ? `권장 케어 주기 ${report.careCycleMonths}개월`
      : null;

  const conditionSummary =
    report?.condition?.summary?.trim() ||
    (isPending ? "불러오는 중" : "리포트 준비중");
  const conditionDetail =
    report?.condition?.detail?.trim() ||
    "아직 충분한 데이터가 쌓이지 않았습니다. 데이터를 수집 할수록 진단이 더 정확해져요.";
  const temperatureLevel = resolveTemperatureLevel(environment?.avgTemperature);
  const humidityLevel = resolveHumidityLevel(environment?.avgHumidity);
  const conditionLevel = resolveConditionLevel({
    summary: report?.condition?.summary,
    temperatureLevel,
    humidityLevel,
  });

  const hasTemperature = environment?.avgTemperature != null;
  const hasHumidity = environment?.avgHumidity != null;
  const temperatureValue = hasTemperature
    ? `${Math.round(Number(environment?.avgTemperature))}°C`
    : MISSING_VALUE;
  const humidityValue = hasHumidity
    ? `${Math.round(Number(environment?.avgHumidity))}%`
    : MISSING_VALUE;

  /**
   * 주의 이상이면 방문 케어를 제안하고 무상 케어(FREE)로 보냅니다.
   * 안전·미수집이면 별도 케어가 필요 없다고 안내하고,
   * 그래도 예약하고 싶은 경우를 위해 케어 컨시어지(PAID)로 보냅니다.
   */
  const needsCare = conditionLevel === "CAUTION" || conditionLevel === "DANGER";

  const goToCareInput = (careType: ReservationType) => {
    setPendingCareType(careType);
    resetDraft();
    router.push("/reservation/input");
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView className="flex-1 px-6" contentContainerClassName="pb-8">
        <View className="mt-6">
          <ScreenHeader title="상태 리포트" onBack={() => router.back()} />
        </View>

        <MetricStatusBar
          temperatureLevel={temperatureLevel}
          humidityLevel={humidityLevel}
        />

        <ConditionCard
          level={conditionLevel}
          summary={conditionSummary}
          detail={conditionDetail}
        />

        {error ? (
          <Text className="mt-2 text-xs text-[#C04737]">{error.message}</Text>
        ) : null}

        <CareRecommendCard
          noticeLabel={needsCare ? nextCareLabel : null}
          title={
            needsCare
              ? "가벼운 컨디션 점검을 제안드려요."
              : "현재는 별도의 방문 케어가 필요하지 않아요."
          }
          onPressReserve={() => goToCareInput(needsCare ? "FREE" : "PAID")}
        />

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

        <InterpretationCard
          description={
            report?.interpretation?.trim() ||
            "아직 제품 상태를 해석할 만큼 데이터가 충분하지 않아요. 며칠 더 데이터를 모으면 맞춤 리포트를 확인할 수 있어요."
          }
        />

        <View className="mt-14 flex-row gap-4">
          <ReportLinkButton
            label="환경 데이터"
            onPress={() => router.push("/care/environment")}
          />
          <ReportLinkButton
            label="관리 가이드"
            onPress={() => router.push("/care/guide")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
