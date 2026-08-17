import { useEffect, useRef, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useDeviceStore } from "@/features/device/store";
import charmOnboardingDevice from "@/features/onboarding/assets/charm-onboarding-device.png";
import { SecondaryButton } from "@/shared/components/SecondaryButton";

type CharmConnectionStatus = "idle" | "connecting" | "failed";
type ScanResultState = "found" | "empty";

type MockCharmDevice = {
  id: string;
  name: string;
  status: CharmConnectionStatus;
  willConnect: boolean;
};

const MOCK_CHARM_DEVICES: MockCharmDevice[] = [
  {
    id: "sn-0001",
    name: "SN-0001",
    status: "idle",
    willConnect: false,
  },
  {
    id: "sn-0033",
    name: "SN-0033",
    status: "idle",
    willConnect: true,
  },
  {
    id: "mxis-charm-01",
    name: "MXIS Charm 01",
    status: "failed",
    willConnect: false,
  },
];

const CONNECTION_DELAY_MS = 1200;
const SEARCH_DELAY_MS = 700;

function StatusPill({ status }: { status: Exclude<CharmConnectionStatus, "idle"> }) {
  const isFailed = status === "failed";
  const color = isFailed ? "#A51F21" : "#814C27";
  const label = isFailed ? "연결 실패" : "연결 중";

  return (
    <View
      className="shrink-0 rounded-full border px-[9px] py-[5px]"
      style={{ borderColor: color }}
    >
      <Text
        className="text-[12px] font-medium"
        style={{ color, letterSpacing: -0.12, lineHeight: 17 }}
      >
        {label}
      </Text>
    </View>
  );
}

function CharmDeviceCard({
  device,
  onPress,
}: {
  device: MockCharmDevice;
  onPress: (device: MockCharmDevice) => void;
}) {
  const isFailed = device.status === "failed";
  const visibleStatus = device.status === "idle" ? null : device.status;
  const dotColor =
    device.status === "failed"
      ? "#A51F21"
      : device.status === "connecting"
        ? "#E4AB7C"
        : "#898989";

  return (
    <Pressable
      onPress={() => onPress(device)}
      className={`flex-row items-center gap-[10px] overflow-hidden rounded-[12px] bg-white px-4 ${
        isFailed ? "min-h-[68px] py-[13px]" : "h-[46px] py-[13px]"
      }`}
    >
      <View
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: dotColor }}
      />

      <View className={isFailed ? "w-[225px] shrink-0" : "min-w-0 flex-1"}>
        <Text
          className="text-[14px] font-semibold text-[#121212]"
          numberOfLines={1}
          style={{ letterSpacing: -0.35, lineHeight: 20 }}
        >
          {device.name}
        </Text>
        {isFailed ? (
          <Text
            className="mt-[2px] w-[237px] text-[14px] font-semibold text-[#63635E]"
            numberOfLines={1}
            style={{ letterSpacing: -0.35, lineHeight: 20 }}
          >
            연결 실패했습니다. 다시 시도해주세요.
          </Text>
        ) : null}
      </View>

      {visibleStatus ? <StatusPill status={visibleStatus} /> : null}
    </Pressable>
  );
}

function SearchBottomActions({ onSearchAgain }: { onSearchAgain: () => void }) {
  return (
    <View className="gap-2">
      <SecondaryButton
        label="다시 검색"
        onPress={onSearchAgain}
        className="h-[52px] rounded-[10px]"
      />
      <Link href="/onboarding/connection-help" asChild>
        <Pressable
          hitSlop={12}
          className="min-h-[34px] items-center justify-center"
        >
          <Text
            className="text-center text-[14px] font-medium text-[#63635E]"
            style={{ letterSpacing: -0.35, lineHeight: 20 }}
          >
            MXIS Charm을 찾지 못하셨나요? 연결 도움말
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}

export function CharmScanScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const addOwnedCharm = useDeviceStore((state) => state.addOwnedCharm);
  const [scanResultState, setScanResultState] =
    useState<ScanResultState>("found");
  const [devices, setDevices] = useState<MockCharmDevice[]>(MOCK_CHARM_DEVICES);
  const [searchCount, setSearchCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetSearch = () => {
    resetTimer();

    setDevices(
      MOCK_CHARM_DEVICES.map((device) => ({
        ...device,
        status: "idle",
      })),
    );

    const nextSearchCount = searchCount + 1;
    setSearchCount(nextSearchCount);

    timerRef.current = setTimeout(() => {
      setScanResultState(nextSearchCount % 2 === 1 ? "empty" : "found");
    }, SEARCH_DELAY_MS);
  };

  const handleConnectDevice = (selectedDevice: MockCharmDevice) => {
    resetTimer();
    setScanResultState("found");

    setDevices((currentDevices) =>
      currentDevices.map((device) => ({
        ...device,
        status: device.id === selectedDevice.id ? "connecting" : "idle",
      })),
    );

    timerRef.current = setTimeout(() => {
      if (selectedDevice.id === "sn-0033") {
        if (returnTo === "device") {
          addOwnedCharm("sn-0033");
          router.replace({
            pathname: "/onboarding/charm-connected",
            params: { returnTo: "device" },
          });
          return;
        }

        router.replace("/onboarding/charm-connected");
        return;
      }

      setDevices((currentDevices) =>
        currentDevices.map((device) => ({
          ...device,
          status: device.id === selectedDevice.id ? "failed" : "idle",
        })),
      );
    }, CONNECTION_DELAY_MS);
  };

  const hasEmptyResult = scanResultState === "empty";

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-concierge-bg">
      <StatusBar style="dark" backgroundColor="#FAF6F1" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="min-h-full px-6 pb-7 pt-[66px]"
        showsVerticalScrollIndicator={false}
      >
        <Text
          className="text-[24px] font-bold text-[#121212]"
          style={{ letterSpacing: -0.6, lineHeight: 34 }}
        >
          MXIS Charm을 찾고 있어요.
        </Text>
        <Text
          className="mt-3 text-[14px] font-medium text-[#63635E]"
          style={{ letterSpacing: -0.35, lineHeight: 20 }}
        >
          스마트폰 가까이에 두고 잠시만 기다려 주세요.
        </Text>

        <View
          className={`h-[301px] items-center justify-center overflow-visible ${
            hasEmptyResult ? "mt-[78px]" : "mt-[58px]"
          }`}
        >
          <Image
            source={charmOnboardingDevice}
            className={
              hasEmptyResult ? "h-[264px] w-[264px]" : "h-[208px] w-[208px]"
            }
            resizeMode="contain"
          />
        </View>

        {hasEmptyResult ? (
          <View className="mt-[44px] items-center">
            <Text
              className="text-center text-[20px] font-bold text-[#814C27]"
              style={{ letterSpacing: -0.5, lineHeight: 28 }}
            >
              연결 가능한 참을 찾을 수 없어요
            </Text>
            <Text
              className="mt-2 text-center text-[14px] font-semibold text-[#656565]"
              style={{ letterSpacing: -0.35, lineHeight: 20 }}
            >
              Charm의 전원이 켜져있는지 확인해 주세요
            </Text>
          </View>
        ) : (
          <View className="mt-[42px] gap-3">
            {devices.map((device) => (
              <CharmDeviceCard
                key={device.id}
                device={device}
                onPress={handleConnectDevice}
              />
            ))}
          </View>
        )}

        <View
          className={hasEmptyResult ? "mt-auto pt-[54px]" : "mt-auto pt-[72px]"}
        >
          <View className="mb-7 items-center">
            <View className="h-[26px] w-px bg-white" />
          </View>
          <SearchBottomActions onSearchAgain={resetSearch} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
