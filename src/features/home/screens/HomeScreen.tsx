import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import clockIcon from "@/features/home/assets/time.png";
import updateIcon from "@/features/home/assets/update.png";
import homeProduct from "@/features/home/assets/home-back.png";
import { useHomeSummary } from "@/features/home/hooks/useHome";
import type { HomeSummary } from "@/features/home/types";
import { usePrimaryProductId } from "@/features/product/hooks/useProduct";
import { formatDateShort } from "@/features/reservation/format";
import { formatLocalTime, parseLocalDate } from "@/shared/api/localTime";
import { AlertModal } from "@/shared/components/AlertModal";
import { Card } from "@/shared/components/Card";
import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";
import { ProgressRing } from "@/shared/components/ProgressRing";

const RECONNECT_PROMPT_INTERVAL_MS = 10 * 60 * 1000;
const ACCENT_TEXT = "#814C27";

type Grade = "EXCELLENT" | "STANDARD" | "NEEDS_ATTENTION";

const GRADE_CONTENT: Record<
  Grade,
  { label: string; description: string; color: string }
> = {
  EXCELLENT: {
    label: "Excellent",
    description: "가벼운 케어와 함께 컨디션을 유지해 주세요.",
    color: "#335940",
  },
  STANDARD: {
    label: "Standard",
    description: "가벼운 케어와 함께 컨디션을 유지해 주세요.",
    color: "#814C17",
  },
  NEEDS_ATTENTION: {
    label: "Needs Attention",
    description: "전문적인 케어를 받아보시길 권장합니다.",
    color: "#A51F21",
  },
};

// 서버는 productState(COLLECTING/NEEDS_UPDATE/NORMAL)와 score(0~100)만 주기 때문에
// 화면에 쓰는 등급 라벨은 score 구간으로 환산해요.
function toGrade(score: number) {
  if (score >= 85) {
    return "EXCELLENT" as const;
  }

  if (score >= 60) {
    return "STANDARD" as const;
  }

  return "NEEDS_ATTENTION" as const;
}

function UpcomingReservationCard({
  reservation,
  onPressDetail,
}: {
  reservation: NonNullable<HomeSummary["upcomingReservation"]>;
  onPressDetail: () => void;
}) {
  const date = parseLocalDate(reservation.reservedDate);
  const time = formatLocalTime(reservation.reservedTime);

  return (
    <>
      <View className="flex-row items-center gap-2">
        <View className="rounded-full border border-concierge-accentMuted px-2 py-0.5">
          <Text className="text-xs text-concierge-accentMuted">
            D-{Math.max(reservation.dDay, 0)}
          </Text>
        </View>
        <Text className="flex-1 text-sm text-concierge-text">
          다가오는 예약
        </Text>
      </View>
      <Text className="mt-3 text-sm font-semibold text-concierge-text">
        {formatDateShort(date)}
        {time ? ` · ${time}` : ""}
      </Text>
      <Text className="mt-1 text-sm text-[#494949]">
        {reservation.storeName ?? "케어 전문가 방문"}
      </Text>
      <Pressable
        onPress={onPressDetail}
        className="mt-4 flex-row items-center justify-between"
      >
        <Text className="text-sm text-concierge-text">예약 상세</Text>
        <ChevronRightIcon size={7} />
      </Pressable>
    </>
  );
}

export function HomeScreen() {
  const router = useRouter();
  const { productId } = usePrimaryProductId();
  const { data: home, isPending } = useHomeSummary(productId);
  const [reconnectModalVisible, setReconnectModalVisible] = useState(false);

  const productState = home?.productState ?? "COLLECTING";
  const score = home?.score ?? 0;
  const isNormal = productState === "NORMAL";
  const grade = isNormal ? toGrade(score) : null;
  const upcomingReservation = home?.upcomingReservation ?? null;
  const needsReconnect = home?.charmNeedsReconnect ?? false;

  // 참(Charm)이 끊긴 상태면 재연결 안내 모달을 바로 띄우고, 10분 주기로 다시 띄워요.
  useEffect(() => {
    if (!needsReconnect) {
      setReconnectModalVisible(false);
      return;
    }

    setReconnectModalVisible(true);
    const interval = setInterval(() => {
      setReconnectModalVisible(true);
    }, RECONNECT_PROMPT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [needsReconnect]);

  const handleReconnect = () => {
    // TODO: 블루투스 연동(참 페어링) 화면이 만들어지면 그쪽으로 이동시켜 주세요. 아직은 화면이 없어서 모달만 닫아요.
    setReconnectModalVisible(false);
  };

  const headline =
    home?.headline ??
    (productState === "COLLECTING"
      ? "Charm과 함께 제품을 사용하면 환경과 사용 기록이 차곡차곡 쌓입니다."
      : productState === "NEEDS_UPDATE"
        ? "새로운 케어 데이터를 기다리고 있어요."
        : "오늘의 케어 상태를 확인해 보세요.");

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        <View className="px-6 pt-6">
          <Text className="text-[15px] font-semibold text-[#747270]">
            안녕하세요, {home?.userName ?? "고객"}님!
          </Text>
          <Text className="mt-1 text-2xl font-bold text-concierge-text">
            {headline}
          </Text>
        </View>

        <Image
          source={
            home?.productImageUrl ? { uri: home.productImageUrl } : homeProduct
          }
          className="mx-auto mt-4 h-[230px] w-[356px] rounded-2xl"
          resizeMode="cover"
        />

        <View className="px-6">
          <Card className="mt-4 flex-row items-center justify-between border-0 bg-white px-5 pr-10 py-6 ">
            <View className="flex-1 pr-6">
              <Text className="text-sm text-concierge-text">제품상태</Text>
              {grade ? (
                <Text
                  className="mt-1 text-xl font-bold"
                  style={{ color: GRADE_CONTENT[grade].color }}
                >
                  {GRADE_CONTENT[grade].label}
                </Text>
              ) : (
                <Text className="mt-1 text-xl font-bold text-concierge-text">
                  {isPending
                    ? "상태를 불러오는 중"
                    : productState === "COLLECTING"
                      ? "데이터 수집 중입니다."
                      : "데이터 업데이트가 필요해요"}
                </Text>
              )}
              <Text className="mt-1 text-sm max-w-[180px] text-concierge-text">
                {grade
                  ? GRADE_CONTENT[grade].description
                  : productState === "COLLECTING"
                    ? "정확한 상태 분석을 위해 환경 데이터를 모으고 있어요."
                    : "최근 측정 데이터가 없어요."}
              </Text>
            </View>
            {grade ? (
              <ProgressRing
                percent={score}
                color={GRADE_CONTENT[grade].color}
                size={60}
              />
            ) : productState === "COLLECTING" ? (
              <Image
                source={clockIcon}
                className="size-13"
                resizeMode="contain"
              />
            ) : (
              <Image
                source={updateIcon}
                className="size-13"
                resizeMode="contain"
              />
            )}
          </Card>

          <View className="mt-4 flex-row gap-3">
            <Card className="flex-1 border-0 bg-white px-4 py-5">
              <Text className="text-sm text-concierge-text">함께한 날짜</Text>
              <Text
                className="mt-5 text-xl font-bold"
                style={{ color: ACCENT_TEXT }}
              >
                {home?.daysTogether != null ? `${home.daysTogether}일` : "-일"}
              </Text>
            </Card>

            <Card className="flex-1 border-0 bg-white px-4 py-5">
              {upcomingReservation ? (
                <UpcomingReservationCard
                  reservation={upcomingReservation}
                  onPressDetail={() =>
                    router.push({
                      pathname: "/reservation/detail",
                      params: { id: String(upcomingReservation.reservationId) },
                    })
                  }
                />
              ) : (
                <>
                  <Text className="text-sm text-concierge-text">
                    다가오는 예약
                  </Text>

                  <Text
                    className="mt-5 text-sm font-semibold"
                    style={{ color: ACCENT_TEXT }}
                  >
                    예정된 예약이 없어요
                  </Text>

                  <Text className="mt-1 mb-4 text-xs text-concierge-textMuted">
                    제품 케어가 필요할때 간편하게 예약할 수 있어요.
                  </Text>

                  <View className="-mx-4 border-t border-concierge-borderLight" />

                  <Pressable
                    onPress={() => router.push("/reservation/input")}
                    className="mt-2 flex-row items-center justify-between"
                  >
                    <Text className="text-sm text-concierge-text">
                      케어 예약하기
                    </Text>
                    <ChevronRightIcon size={7} />
                  </Pressable>
                </>
              )}
            </Card>
          </View>
        </View>
      </ScrollView>

      <AlertModal
        visible={reconnectModalVisible}
        title="MXIS Charm 재연결이 필요해요"
        description="MXIS Charm을 다시 연결하면 등록을 계속할 수 있어요."
        actions={[
          { label: "나중에", onPress: () => setReconnectModalVisible(false) },
          { label: "다시 연결", onPress: handleReconnect, variant: "accent" },
        ]}
        onRequestClose={() => setReconnectModalVisible(false)}
      />
    </SafeAreaView>
  );
}
