import { useEffect, useRef, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useDeviceStore } from "@/features/device/store";
import {
  getConnectionPolicy,
  getDevices,
  registerDevice,
  type DeviceResponse,
} from "@/features/onboarding/api/onboardingApi";
import charmOnboardingDevice from "@/features/onboarding/assets/charm-onboarding-device.png";
import { SecondaryButton } from "@/shared/components/SecondaryButton";

type CharmConnectionStatus = "idle" | "connecting" | "failed";
type ScanResultState = "found" | "empty";

type MockCharmDevice = {
  id: string;
  name: string;
  serialNumber: string;
  macAddress: string;
  status: CharmConnectionStatus;
  willConnect: boolean;
};

const MOCK_CHARM_DEVICES: MockCharmDevice[] = [
  {
    id: "sn-0001",
    name: "SN-0001",
    serialNumber: "SN-0001",
    macAddress: "AA:BB:CC:DD:EE:01",
    status: "idle",
    willConnect: false,
  },
  {
    id: "sn-0033",
    name: "SN-0033",
    serialNumber: "SN-0033",
    macAddress: "AA:BB:CC:DD:EE:33",
    status: "idle",
    willConnect: true,
  },
  {
    id: "mxis-charm-01",
    name: "SN-005555",
    serialNumber: "SN-005555",
    macAddress: "AA:BB:CC:DD:EE:55",
    status: "failed",
    willConnect: false,
  },
];

const CONNECTION_DELAY_MS = 1200;
const SEARCH_DELAY_MS = 700;
// 이 개수를 넘으면 목록 공간을 넓혀서 스크롤로 보게 합니다.
const VISIBLE_DEVICE_LIMIT = 3;

// 안드로이드에서 알약 배지 안 한글 텍스트가 위쪽이 잘려 보이는 문제가 있어서,
// 텍스트 줄높이에 기대지 않고 고정 높이 + 가운데 정렬로 넉넉하게 감싸줍니다.
function StatusPill({
  status,
}: {
  status: Exclude<CharmConnectionStatus, "idle">;
}) {
  const isFailed = status === "failed";
  const color = isFailed ? "#A51F21" : "#814C27";
  const label = isFailed ? "연결 실패" : "연결 중";

  return (
    <View
      className="h-6 shrink-0 items-center justify-center rounded-full border px-2.5"
      style={{ borderColor: color }}
    >
      <Text className="text-xs font-medium" style={{ color, lineHeight: 18 }}>
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
      className={`flex-row items-center gap-2.5 overflow-hidden rounded-xl bg-white px-4 ${
        isFailed ? "min-h-[56px] py-2.5" : "h-11 py-2.5"
      }`}
    >
      <View
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: dotColor }}
      />

      <View className="min-w-0 flex-1">
        <Text
          className="text-sm font-semibold text-concierge-text"
          numberOfLines={1}
        >
          {device.name}
        </Text>
        {isFailed ? (
          <Text
            className="mt-0.5 text-xs font-medium text-concierge-textSecondary"
            numberOfLines={1}
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
      <SecondaryButton label="다시 검색" onPress={onSearchAgain} />
      <Link href="/onboarding/connection-help" asChild>
        <Pressable
          hitSlop={12}
          className="min-h-[32px] items-center justify-center"
        >
          <Text className="text-center text-sm font-medium text-concierge-textSecondary">
            MXIS Charm을 찾지 못하셨나요? 연결 도움말
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}

// 상단 안내와 하단 버튼은 고정하고, 스캔된 기기 목록만 남은 공간에서 스크롤되게 합니다.
export function CharmScanScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const accessToken = useAuthStore((state) => state.accessToken);
  const tokenType = useAuthStore((state) => state.tokenType);
  const addOwnedCharm = useDeviceStore((state) => state.addOwnedCharm);
  const [scanResultState, setScanResultState] =
    useState<ScanResultState>("found");
  const [devices, setDevices] = useState<MockCharmDevice[]>(MOCK_CHARM_DEVICES);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchCount, setSearchCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getConnectionPolicy().catch(() => {
      // 실제 BLE 스캔 필터 적용 시 사용할 정책입니다. 조회 실패해도 mock 스캔 UI는 유지합니다.
    });

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
    setErrorMessage("");

    const nextSearchCount = searchCount + 1;
    setSearchCount(nextSearchCount);

    timerRef.current = setTimeout(() => {
      setScanResultState(nextSearchCount % 2 === 1 ? "empty" : "found");
    }, SEARCH_DELAY_MS);
  };

  const moveToConnectedScreen = (
    selectedDevice: MockCharmDevice,
    registeredDevice?: DeviceResponse,
  ) => {
    const nextDeviceId = registeredDevice?.id ?? 33;
    const nextDeviceSerial =
      registeredDevice?.serialNumber ?? selectedDevice.serialNumber;

    if (returnTo === "device") {
      addOwnedCharm(selectedDevice.id);
      router.replace({
        pathname: "/onboarding/charm-connected",
        params: {
          returnTo: "device",
          deviceId: String(nextDeviceId),
          deviceSerial: nextDeviceSerial,
        },
      });
      return;
    }

    router.replace({
      pathname: "/onboarding/charm-connected",
      params: {
        deviceId: String(nextDeviceId),
        deviceSerial: nextDeviceSerial,
      },
    });
  };

  const handleConnectDevice = (selectedDevice: MockCharmDevice) => {
    resetTimer();
    setScanResultState("found");
    setErrorMessage("");

    setDevices((currentDevices) =>
      currentDevices.map((device) => ({
        ...device,
        status: device.id === selectedDevice.id ? "connecting" : "idle",
      })),
    );

    timerRef.current = setTimeout(async () => {
      if (selectedDevice.willConnect) {
        moveToConnectedScreen(selectedDevice);
        return;
      }

      if (selectedDevice.willConnect) {
        if (!accessToken) {
          setErrorMessage("로그인 정보가 없어 MXIS Charm을 등록할 수 없습니다.");
          setDevices((currentDevices) =>
            currentDevices.map((device) => ({
              ...device,
              status: device.id === selectedDevice.id ? "failed" : "idle",
            })),
          );
          return;
        }

        try {
          let registeredDevice: DeviceResponse;

          try {
            registeredDevice = await registerDevice(
              {
                serialNumber: selectedDevice.serialNumber,
                deviceName: selectedDevice.name,
                macAddress: selectedDevice.macAddress,
                firmwareVersion: "1.0.0",
              },
              accessToken,
              tokenType,
            );
          } catch {
            const ownedDevices = await getDevices(accessToken, tokenType);
            const existingDevice = ownedDevices.find(
              (device) => device.serialNumber === selectedDevice.serialNumber,
            );

            if (!existingDevice) {
              throw new Error("MXIS Charm 등록에 실패했습니다.");
            }

            registeredDevice = existingDevice;
          }

          if (returnTo === "device") {
            addOwnedCharm(selectedDevice.id);
            router.replace({
              pathname: "/onboarding/charm-connected",
              params: {
                returnTo: "device",
                deviceId: String(registeredDevice.id),
                deviceSerial: registeredDevice.serialNumber,
              },
            });
            return;
          }

          router.replace({
            pathname: "/onboarding/charm-connected",
            params: {
              deviceId: String(registeredDevice.id),
              deviceSerial: registeredDevice.serialNumber,
            },
          });
          return;
        } catch (error) {
          setErrorMessage(
            error instanceof Error ? error.message : "MXIS Charm 등록에 실패했습니다.",
          );
          setDevices((currentDevices) =>
            currentDevices.map((device) => ({
              ...device,
              status: device.id === selectedDevice.id ? "failed" : "idle",
            })),
          );
        }
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
  // 기기가 많으면 일러스트가 목록 공간을 너무 많이 차지하므로 조금 줄입니다.
  const hasManyDevices = devices.length > VISIBLE_DEVICE_LIMIT;

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-concierge-bg">
      <StatusBar style="dark" backgroundColor="#FAF6F1" />
      <View className="flex-1 px-6 pb-6 pt-6">
        <View className="min-h-0 flex-1">
          <Text className="text-2xl font-bold text-concierge-text">
            MXIS Charm을 찾고 있어요.
          </Text>
          <Text className="mt-5 text-sm text-concierge-textSecondary">
            스마트폰 가까이에 두고 잠시만 기다려 주세요.
          </Text>

          <View
            className={`shrink-0 items-center justify-center overflow-visible ${
              hasEmptyResult
                ? "mt-40 mb-20 h-[200px]"
                : hasManyDevices
                  ? "mt-8 mb-6 h-[140px]"
                  : "mt-20 mb-10 h-[180px]"
            }`}
          >
            <Image
              source={charmOnboardingDevice}
              className={
                hasEmptyResult
                  ? "h-[370px] w-[370px]"
                  : hasManyDevices
                    ? "h-[220px] w-[220px]"
                    : "h-[280px] w-[280px]"
              }
              resizeMode="contain"
            />
          </View>

          {hasEmptyResult ? (
            <View className="mt-4 items-center">
              <Text className="text-center text-lg font-bold text-concierge-primary">
                연결 가능한 참을 찾을 수 없어요
              </Text>
              <Text className="mt-1.5 text-center text-sm font-semibold text-concierge-textSecondary">
                Charm의 전원이 켜져있는지 확인해 주세요
              </Text>
            </View>
          ) : (
            <View className="mt-4 min-h-0 flex-1">
              <ScrollView
                className="flex-1"
                contentContainerClassName="gap-2 pb-1"
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
              >
                {devices.map((device) => (
                  <CharmDeviceCard
                    key={device.id}
                    device={device}
                    onPress={handleConnectDevice}
                  />
                ))}
                {errorMessage ? (
                  <Text className="text-center text-xs font-medium text-[#C04737]">
                    {errorMessage}
                  </Text>
                ) : null}
              </ScrollView>
            </View>
          )}
        </View>

        <SearchBottomActions onSearchAgain={resetSearch} />
      </View>
    </SafeAreaView>
  );
}
