import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import clockIcon from "@/features/device/assets/clock.png";
import homeProduct from "@/features/home/assets/home-back.png";
import { formatDateShort } from "@/features/reservation/format";
import { useReservationStore } from "@/features/reservation/store";
import { AlertModal } from "@/shared/components/AlertModal";
import { Card } from "@/shared/components/Card";
import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";
import { RefreshIcon } from "@/shared/components/icons/RefreshIcon";
import { ProgressRing } from "@/shared/components/ProgressRing";
import { colors } from "@/shared/styles/colors";

const RECONNECT_PROMPT_INTERVAL_MS = 10 * 60 * 1000;
const ACCENT_TEXT = "#C1703F";

type CharmState = "COLLECTING" | "NEEDS_UPDATE" | "EXCELLENT" | "STANDARD" | "NEEDS_ATTENTION";

type Grade = "EXCELLENT" | "STANDARD" | "NEEDS_ATTENTION";

const GRADE_CONTENT: Record<Grade, { label: string; description: string; percent: number; color: string }> = {
  EXCELLENT: {
    label: "Excellent",
    description: "가벼운 케어와 함께 컨디션을 유지해 주세요.",
    percent: 100,
    color: "#4C9A6D",
  },
  STANDARD: {
    label: "Standard",
    description: "가벼운 케어와 함께 컨디션을 유지해 주세요.",
    percent: 70,
    color: colors.accent,
  },
  NEEDS_ATTENTION: {
    label: "Needs Attention",
    description: "전문적인 케어를 받아보시길 권장합니다.",
    percent: 35,
    color: "#C1573A",
  },
};

function daysUntil(date: Date) {
  const today = new Date();
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round(
    (target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
}

// Charm 진단 API가 붙기 전까지, 5가지 상태 디자인을 바로 확인해볼 수 있는 테스트 토글이에요.
function StatusTestToggle({
  current,
  onSelect,
}: {
  current: CharmState;
  onSelect: (state: CharmState) => void;
}) {
  const options: { key: CharmState; label: string }[] = [
    { key: "COLLECTING", label: "수집중" },
    { key: "NEEDS_UPDATE", label: "업데이트필요" },
    { key: "EXCELLENT", label: "Excellent" },
    { key: "STANDARD", label: "Standard" },
    { key: "NEEDS_ATTENTION", label: "Needs Attention" },
  ];

  return (
    <View className="mx-6 mt-3 flex-row flex-wrap items-center gap-2 rounded-xl border border-dashed border-concierge-border bg-white px-3 py-2.5">
      <Text className="text-xs font-semibold text-concierge-textMuted">테스트</Text>
      <View className="flex-1 flex-row flex-wrap justify-end gap-1.5">
        {options.map((option) => (
          <Pressable
            key={option.key}
            onPress={() => onSelect(option.key)}
            className={`rounded-full px-2.5 py-1 ${
              current === option.key ? "bg-concierge-primary" : "bg-concierge-chip"
            }`}
          >
            <Text
              className={`text-xs ${
                current === option.key ? "text-white" : "text-concierge-textSecondary"
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function HomeScreen() {
  const router = useRouter();
  const confirmed = useReservationStore((state) => state.confirmed);
  const [charmState, setCharmState] = useState<CharmState>("EXCELLENT");
  const [reconnectModalVisible, setReconnectModalVisible] = useState(false);

  const isConnected = charmState !== "COLLECTING" && charmState !== "NEEDS_UPDATE";

  // 참(Charm)이 끊긴 상태면 재연결 안내 모달을 바로 띄우고, 10분 주기로 다시 띄워요.
  useEffect(() => {
    if (charmState !== "NEEDS_UPDATE") {
      setReconnectModalVisible(false);
      return;
    }

    setReconnectModalVisible(true);
    const interval = setInterval(() => {
      setReconnectModalVisible(true);
    }, RECONNECT_PROMPT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [charmState]);

  const handleReconnect = () => {
    // TODO: 블루투스 연동(참 페어링) 화면이 만들어지면 그쪽으로 이동시켜 주세요. 아직은 화면이 없어서 모달만 닫아요.
    setReconnectModalVisible(false);
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        <StatusTestToggle current={charmState} onSelect={setCharmState} />

        <View className="px-6 pt-4">
          <Text className="text-[15px] font-semibold text-[#747270]">
            안녕하세요, 김멋사님!
          </Text>
          {charmState === "COLLECTING" ? (
            <Text className="mt-1 text-2xl font-bold text-concierge-text">
              Charm과 함께 제품을 사용하면 환경과 사용 기록이 차곡차곡
              쌓입니다.
            </Text>
          ) : charmState === "NEEDS_UPDATE" ? (
            <Text className="mt-1 text-2xl font-bold text-concierge-text">
              새로운 케어 데이터를 기다리고 있어요.
            </Text>
          ) : (
            <>
              <Text className="mt-1 text-2xl font-bold text-concierge-text">
                햇빛이 강한 날이에요
              </Text>
              <Text className="text-2xl font-bold text-concierge-text">
                직사광선을 피해 보관해주세요.
              </Text>
            </>
          )}
        </View>

        <Image
          source={homeProduct}
          className="mx-auto mt-4 h-[208px] w-[356px] rounded-2xl"
          resizeMode="cover"
        />

        <View className="px-6">
          <Card className="mt-4 flex-row items-center justify-between border-0 bg-white px-5 py-6">
            <View className="flex-1 pr-4">
              <Text className="text-sm text-concierge-text">제품상태</Text>
              {isConnected ? (
                <Text
                  className="mt-1 text-xl font-bold"
                  style={{ color: GRADE_CONTENT[charmState as Grade].color }}
                >
                  {GRADE_CONTENT[charmState as Grade].label}
                </Text>
              ) : (
                <Text className="mt-1 text-xl font-bold text-concierge-text">
                  {charmState === "COLLECTING"
                    ? "데이터 수집 중입니다."
                    : "데이터 업데이트가 필요해요"}
                </Text>
              )}
              <Text className="mt-1 text-sm text-concierge-text">
                {isConnected
                  ? GRADE_CONTENT[charmState as Grade].description
                  : charmState === "COLLECTING"
                    ? "정확한 상태 분석을 위해 환경 데이터를 모으고 있어요."
                    : "최근 측정 데이터가 없어요."}
              </Text>
            </View>
            {isConnected ? (
              <ProgressRing
                percent={GRADE_CONTENT[charmState as Grade].percent}
                color={GRADE_CONTENT[charmState as Grade].color}
                size={60}
              />
            ) : charmState === "COLLECTING" ? (
              <Image source={clockIcon} className="size-11" resizeMode="contain" />
            ) : (
              <View className="size-11 items-center justify-center rounded-full border border-concierge-borderLight">
                <RefreshIcon size={20} color={colors.text} />
              </View>
            )}
          </Card>

          <View className="mt-4 flex-row gap-3">
            <Card className="flex-1 border-0 bg-white px-4 py-5">
              <Text className="text-sm text-concierge-text">함께한 날짜</Text>
              <Text className="mt-5 text-xl font-bold" style={{ color: ACCENT_TEXT }}>
                182일
              </Text>
            </Card>

            <Card className="flex-1 border-0 bg-white px-4 py-5">
              {confirmed ? (
                <>
                  <View className="flex-row items-center gap-2">
                    <View className="rounded-full border border-concierge-accentMuted px-2 py-0.5">
                      <Text className="text-xs text-concierge-accentMuted">
                        D-{Math.max(daysUntil(confirmed.date), 0)}
                      </Text>
                    </View>
                    <Text className="flex-1 text-sm text-concierge-text">
                      다가오는 예약
                    </Text>
                  </View>
                  <Text className="mt-3 text-sm font-semibold text-concierge-text">
                    {formatDateShort(confirmed.date)} · {confirmed.time}
                  </Text>
                  <Text className="mt-1 text-sm text-[#494949]">
                    케어 전문가 방문
                  </Text>
                  <Pressable
                    onPress={() => router.push("/reservation/detail")}
                    className="mt-4 flex-row items-center justify-between"
                  >
                    <Text className="text-sm text-concierge-text">
                      예약 상세
                    </Text>
                    <ChevronRightIcon size={7} />
                  </Pressable>
                </>
              ) : (
                <>
                  <Text className="text-sm text-concierge-text">
                    다가오는 예약
                  </Text>
                  <Text className="mt-5 text-sm font-semibold" style={{ color: ACCENT_TEXT }}>
                    예정된 예약이 없어요
                  </Text>
                  <Text className="mt-1 text-xs text-concierge-textMuted">
                    제품 케어가 필요할때 간편하게 예약할 수 있어요.
                  </Text>
                  <Pressable
                    onPress={() => router.push("/reservation/input")}
                    className="mt-4 flex-row items-center justify-between"
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
