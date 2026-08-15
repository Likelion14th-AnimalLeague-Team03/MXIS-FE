import { useEffect, useRef, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import charmOnboardingDevice from "@/features/onboarding/assets/charm-onboarding-device.png";
import { SecondaryButton } from "@/shared/components/SecondaryButton";

type CharmConnectionStatus = "waiting" | "connecting" | "failed";

type MockCharmDevice = {
  id: string;
  name: string;
  status: CharmConnectionStatus;
};

const MOCK_CHARM_DEVICES: MockCharmDevice[] = [
  {
    id: "mock-charm-01",
    name: "MXIS Charm 01",
    status: "waiting",
  },
  {
    id: "mock-charm-02",
    name: "MXIS Charm 02",
    status: "waiting",
  },
];

const STATUS_LABEL: Record<CharmConnectionStatus, string> = {
  waiting: "연결 대기",
  connecting: "연결 중",
  failed: "연결 실패",
};

const STATUS_DESCRIPTION: Record<CharmConnectionStatus, string> = {
  waiting: "검색 중 · 가까운 기기를 확인하고 있습니다.",
  connecting: "연결 중 · Charm과 안전하게 연결하고 있습니다.",
  failed: "연결이 중단되었습니다. 다시 시도해주세요.",
};

function getStatusTone(status: CharmConnectionStatus) {
  if (status === "failed") {
    return {
      dot: "#C04737",
      border: "#C04737",
      text: "#C04737",
      background: "#FFF7F5",
    };
  }

  if (status === "connecting") {
    return {
      dot: "#E4AB7C",
      border: "#95592C",
      text: "#95592C",
      background: "#FFFFFF",
    };
  }

  return {
    dot: "#71EBA3",
    border: "#95592C",
    text: "#95592C",
    background: "#FFFFFF",
  };
}

function CharmDeviceCard({
  device,
  onPress,
}: {
  device: MockCharmDevice;
  onPress: (id: string) => void;
}) {
  const tone = getStatusTone(device.status);

  return (
    <Pressable
      onPress={() => onPress(device.id)}
      className="min-h-[68px] flex-row items-center rounded-[14px] px-4 py-4"
      style={{ backgroundColor: tone.background }}
    >
      <View
        className="mr-[10px] h-[10px] w-[10px] rounded-full"
        style={{ backgroundColor: tone.dot }}
      />
      <View className="min-w-0 flex-1 pr-2">
        <Text
          className="text-[16px] font-bold text-[#201C19]"
          style={{ letterSpacing: -0.4 }}
        >
          {device.name}
        </Text>
        <Text
          className="mt-1 text-[12px] font-semibold text-[#6E6964]"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.9}
          style={{ letterSpacing: -0.24, lineHeight: 18 }}
        >
          {STATUS_DESCRIPTION[device.status]}
        </Text>
      </View>
      <View
        className="rounded-full border px-[9px] py-[6px]"
        style={{ borderColor: tone.border }}
      >
        <Text
          className="text-[12px] font-semibold"
          style={{ color: tone.text, letterSpacing: -0.3 }}
        >
          {STATUS_LABEL[device.status]}
        </Text>
      </View>
    </Pressable>
  );
}

export function CharmScanScreen() {
  const [devices, setDevices] = useState<MockCharmDevice[]>(MOCK_CHARM_DEVICES);
  const connectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (connectionTimerRef.current) {
        clearTimeout(connectionTimerRef.current);
      }
    };
  }, []);

  const resetSearch = () => {
    if (connectionTimerRef.current) {
      clearTimeout(connectionTimerRef.current);
    }

    setDevices(
      MOCK_CHARM_DEVICES.map((device) => ({
        ...device,
        status: "waiting",
      })),
    );
  };

  const handleConnectDevice = (id: string) => {
    if (connectionTimerRef.current) {
      clearTimeout(connectionTimerRef.current);
    }

    setDevices((currentDevices) =>
      currentDevices.map((device) => ({
        ...device,
        status: device.id === id ? "connecting" : "waiting",
      })),
    );

    connectionTimerRef.current = setTimeout(() => {
      setDevices((currentDevices) =>
        currentDevices.map((device) => ({
          ...device,
          status: device.id === id ? "failed" : device.status,
        })),
      );
    }, 1400);
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-concierge-bg">
      <StatusBar style="dark" backgroundColor="#FAF6F1" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="min-h-full px-6 pb-7 pt-[72px]"
        showsVerticalScrollIndicator={false}
      >
        <Text
          className="text-[24px] font-bold text-[#171310]"
          style={{ letterSpacing: -0.6, lineHeight: 32 }}
        >
          MXIS Charm을 찾고 있어요.
        </Text>
        <Text
          className="mt-7 text-[16px] font-semibold text-[#6E6964]"
          style={{ letterSpacing: -0.4, lineHeight: 26 }}
        >
          스마트폰 가까이에 두고 잠시만 기다려 주세요.
        </Text>

        <View className="mt-[62px] h-[258px] items-center justify-center overflow-visible">
          <Image
            source={charmOnboardingDevice}
            className="h-[246px] w-[246px]"
            resizeMode="contain"
          />
        </View>

        <View className="mt-[62px] gap-3">
          {devices.map((device) => (
            <CharmDeviceCard
              key={device.id}
              device={device}
              onPress={handleConnectDevice}
            />
          ))}
        </View>

        <View className="mt-auto pt-[170px]">
          <SecondaryButton
            label="다시 검색"
            onPress={resetSearch}
            className="h-[58px] rounded-[10px]"
          />
          <Link href="/onboarding/connection-help" asChild>
            <Pressable
              hitSlop={12}
              className="mt-3 min-h-[44px] items-center justify-center"
            >
              <Text
                className="text-[15px] font-semibold text-[#77716C]"
                style={{ letterSpacing: -0.38, lineHeight: 22 }}
              >
                MXIS Charm을 찾지 못하셨나요? 연결 도움말
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
