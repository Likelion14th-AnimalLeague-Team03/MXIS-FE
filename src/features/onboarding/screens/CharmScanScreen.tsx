import { useEffect, useRef, useState } from "react";
import {
  Image,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { type BleError, type Device as BleDevice } from "react-native-ble-plx";
import { useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useDeviceStore } from "@/features/device/store";
import {
  getConnectionPolicy,
  getDevices,
  registerDevice,
  type DeviceResponse,
} from "@/features/onboarding/api/onboardingApi";
import {
  connectSmartCharm,
  DEFAULT_SMART_CHARM_SERVICE_UUIDS,
  disconnectSmartCharmConnection,
  getBleDeviceName,
  getSmartCharmBleManager,
  isSmartCharmDevice,
  resolveOrangeScanPolicy,
} from "@/features/onboarding/ble/smartCharmBle";
import { collectSmartCharm, registerSmartCharmBackend } from "@/features/onboarding/ble/smartCharmSync";
import charmOnboardingDevice from "@/features/onboarding/assets/charm-onboarding-device.png";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { SecondaryButton } from "@/shared/components/SecondaryButton";

type CharmConnectionStatus = "idle" | "connecting" | "checking" | "syncing" | "registering" | "failed" | "setup-failed";
type ScanResultState = "scanning" | "found" | "empty";

type CharmDevice = {
  id: string;
  name: string;
  serialNumber: string;
  macAddress?: string;
  serviceUUIDs: string[];
  status: CharmConnectionStatus;
  bleDevice: BleDevice;
};

const DEFAULT_SCAN_TIMEOUT_SECONDS = 8;
const CONNECT_TIMEOUT_MS = 10000;

function getDebugErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "알 수 없는 오류";
}

async function runBleDebugStep<T>(
  stepName: string,
  action: () => Promise<T>,
) {
  console.log(`[Charm BLE] ${stepName} start`);

  try {
    const result = await action();
    console.log(`[Charm BLE] ${stepName} success`);

    return result;
  } catch (error) {
    const message = getDebugErrorMessage(error);
    console.error(`[Charm BLE] ${stepName} failed`, error);

    throw new Error(`${stepName} 실패: ${message}`);
  }
}

async function ensureAndroidBluetoothPermissions() {
  if (Platform.OS !== "android") return true;

  const permissions =
    Platform.Version >= 31
      ? [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]
      : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];

  const result = await PermissionsAndroid.requestMultiple(permissions);

  return permissions.every(
    (permission) => result[permission] === PermissionsAndroid.RESULTS.GRANTED,
  );
}

function StatusPill({
  status,
}: {
  status: Exclude<CharmConnectionStatus, "idle">;
}) {
  const isFailed = status === "failed" || status === "setup-failed";
  const color = isFailed ? "#A51F21" : "#814C27";
  const label = { connecting: "연결 중", checking: "기기 확인", syncing: "데이터 수신", registering: "서버 등록", failed: "연결 실패", "setup-failed": "준비 실패" }[status];

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
  device: CharmDevice;
  onPress: (device: CharmDevice) => void;
}) {
  const isFailed = device.status === "failed" || device.status === "setup-failed";
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
          {device.serialNumber}
        </Text>
        {isFailed ? (
          <Text
            className="mt-0.5 text-xs font-medium text-concierge-textSecondary"
            numberOfLines={1}
          >
            아래 오류 내용을 확인한 뒤 다시 시도해주세요.
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

export function CharmScanScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const accessToken = useAuthStore((state) => state.accessToken);
  const tokenType = useAuthStore((state) => state.tokenType);
  const ownerId = useAuthStore((state) => String(state.user?.id ?? ""));
  const addOwnedCharm = useDeviceStore((state) => state.addOwnedCharm);
  const bleManagerRef = useRef(getSmartCharmBleManager());
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const connectingRef = useRef(false);
  const handedOffRef = useRef(false);
  const scanRunRef = useRef(0);
  const [scanResultState, setScanResultState] =
    useState<ScanResultState>("scanning");
  const [devices, setDevices] = useState<CharmDevice[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [allowedServiceUuids, setAllowedServiceUuids] = useState(DEFAULT_SMART_CHARM_SERVICE_UUIDS);
  const [policyReady, setPolicyReady] = useState(false);
  const [policyError, setPolicyError] = useState("");
  const [scanTimeoutSeconds, setScanTimeoutSeconds] = useState(
    DEFAULT_SCAN_TIMEOUT_SECONDS,
  );

  const hasEmptyResult = scanResultState === "empty";

  const stopScan = () => {
    scanRunRef.current++;
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    return bleManagerRef.current.stopDeviceScan().catch(() => undefined);
  };

  const startScan = async () => {
    if (!policyReady || connectingRef.current) return;
    const stopped = stopScan();
    const scanRun = scanRunRef.current;
    await stopped;
    if (!mountedRef.current || scanRun !== scanRunRef.current) return;
    if (policyError) {
      setScanResultState("empty");
      setErrorMessage(policyError);
      return;
    }
    setDevices([]);
    setErrorMessage("");
    setScanResultState("scanning");

    const hasPermission = await ensureAndroidBluetoothPermissions().catch(() => false);
    if (!mountedRef.current || scanRun !== scanRunRef.current) return;
    if (!hasPermission) {
      setScanResultState("empty");
      setErrorMessage("MXIS Charm을 찾으려면 Bluetooth 권한 허용이 필요합니다.");
      return;
    }

    try {
      const state = await bleManagerRef.current.state();
      if (!mountedRef.current || scanRun !== scanRunRef.current) return;
      if (state !== "PoweredOn") throw new Error("휴대폰의 Bluetooth를 켠 뒤 다시 검색해 주세요.");
      await bleManagerRef.current.startDeviceScan(
      allowedServiceUuids,
      { allowDuplicates: false },
      (error: BleError | null, scannedDevice: BleDevice | null) => {
        if (!mountedRef.current || scanRun !== scanRunRef.current) return;
        if (error) {
          setScanResultState("empty");
          setErrorMessage("Bluetooth 검색을 시작하지 못했습니다.");
          stopScan();
          return;
        }

        if (!scannedDevice || !isSmartCharmDevice(scannedDevice, allowedServiceUuids)) {
          return;
        }

        setScanResultState("found");
        setDevices((currentDevices) => {
          if (currentDevices.some((device) => device.id === scannedDevice.id)) {
            return currentDevices;
          }

          return [
            ...currentDevices,
            {
              id: scannedDevice.id,
              name: getBleDeviceName(scannedDevice),
              serialNumber: getBleDeviceName(scannedDevice), // Display label only; ID command replaces it before registration.
              macAddress: scannedDevice.id,
              serviceUUIDs: scannedDevice.serviceUUIDs ?? [],
              status: "idle",
              bleDevice: scannedDevice,
            },
          ];
        });
      },
    );

    } catch (error) {
      if (mountedRef.current && scanRun === scanRunRef.current) {
        setScanResultState("empty");
        setErrorMessage(getDebugErrorMessage(error));
        stopScan();
      }
      return;
    }
    if (!mountedRef.current || scanRun !== scanRunRef.current) return;
    scanTimerRef.current = setTimeout(() => {
      stopScan();
      setScanResultState((current) =>
        current === "found" ? "found" : "empty",
      );
    }, scanTimeoutSeconds * 1000);
  };

  useEffect(() => {
    let cancelled = false;
    getConnectionPolicy()
      .then((policy) => {
        if (cancelled) return;
        try {
          const uuids = resolveOrangeScanPolicy(policy.allowedServiceUuids);
          setAllowedServiceUuids(uuids);
          console.log("[Charm BLE] scan policy", { source: "server", effectiveScanServiceUuids: uuids });
        } catch (error) {
          setPolicyError(getDebugErrorMessage(error));
        }
        setScanTimeoutSeconds(
          Number.isFinite(policy.scanTimeoutSeconds)
            ? Math.min(30, Math.max(3, policy.scanTimeoutSeconds)) : DEFAULT_SCAN_TIMEOUT_SECONDS,
        );
      })
      .catch(() => {
        if (cancelled) return;
        setAllowedServiceUuids(DEFAULT_SMART_CHARM_SERVICE_UUIDS);
        console.warn("[Charm BLE] connection-policy unavailable; local Orange UUID configuration used");
      })
      .finally(() => { if (!cancelled) setPolicyReady(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (connectingRef.current && !handedOffRef.current) void disconnectSmartCharmConnection();
    };
  }, []);

  useEffect(() => {
    startScan();

    return () => {
      stopScan();
    };
    // 정책 API에서 받은 Service UUID와 timeout이 바뀌면 스캔을 다시 시작합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policyReady, policyError, allowedServiceUuids.join(","), scanTimeoutSeconds]);
  const moveToConnectedScreen = (
    selectedDevice: CharmDevice,
    registeredDevice: DeviceResponse,
  ) => {
    const nextDeviceId = registeredDevice.id;
    const nextDeviceSerial =
      registeredDevice.serialNumber || selectedDevice.serialNumber;

    if (returnTo === "device") {
      addOwnedCharm(String(nextDeviceId));
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

  const registerConnectedDevice = async (
    selectedDevice: CharmDevice,
    smartCharmDeviceId: string,
  ) => {
    if (!accessToken) {
      throw new Error("로그인 정보가 없어 MXIS Charm을 등록할 수 없습니다.");
    }

    try {
      return await registerDevice(
        {
          serialNumber: smartCharmDeviceId,
          deviceName: selectedDevice.name,
          macAddress: selectedDevice.macAddress,
        },
        accessToken,
        tokenType,
      );
    } catch (registrationError) {
      const ownedDevices = await getDevices(accessToken, tokenType).catch(() => { throw registrationError; });
      const existingDevice = ownedDevices.find(
        (device) => device.serialNumber === smartCharmDeviceId,
      );

      if (!existingDevice) {
        throw registrationError;
      }

      return existingDevice;
    }
  };

  const handleConnectDevice = async (selectedDevice: CharmDevice) => {
    if (connectingRef.current) return;
    if (!ownerId || !accessToken) {
      setErrorMessage("로그인 후 참을 연결해 주세요.");
      return;
    }
    connectingRef.current = true;
    handedOffRef.current = false;
    let stage = "BLE 연결";
    const updateStage = (name: string, status: CharmConnectionStatus = "checking") => {
      if (!mountedRef.current || String(useAuthStore.getState().user?.id ?? "") !== ownerId) throw new Error("연결 작업이 취소되었습니다.");
      stage = name;
      console.log(`[Charm BLE] ${name}`);
      setDevices((items) => items.map((item) => item.id === selectedDevice.id ? { ...item, status } : item));
    };
    stopScan();
    setScanResultState("found");
    setErrorMessage("");
    setDevices((currentDevices) =>
      currentDevices.map((device) => ({
        ...device,
        status: device.id === selectedDevice.id ? "connecting" : "idle",
      })),
    );

    try {
      const connection = await connectSmartCharm(selectedDevice.id, ownerId, {
        timeoutMs: CONNECT_TIMEOUT_MS,
        onStage: (name) => updateStage(name, name === "BLE 연결" ? "connecting" : "checking"),
      });
      const resolvedDevice = { ...selectedDevice, serialNumber: connection.serialNumber };
      updateStage("시간 설정 및 전체 센서 수신", "syncing");
      const sync = await collectSmartCharm(connection);
      console.log("[Charm BLE] SYNC verified", { count: sync.readings.length, through: sync.through, dropped: sync.after.dropped });
      updateStage("서버 기기 등록", "registering");
      const registeredDevice = await runBleDebugStep("서버 기기 등록", () => registerConnectedDevice(resolvedDevice, connection.serialNumber));
      if (registeredDevice.serialNumber !== connection.serialNumber) throw new Error("서버가 반환한 참 ID가 실제 기기와 다릅니다.");
      await registerSmartCharmBackend(ownerId, connection.serialNumber, registeredDevice.id);
      await queryClient.invalidateQueries({ queryKey: ["device"] });
      updateStage("등록 완료", "registering");
      handedOffRef.current = true;
      moveToConnectedScreen(resolvedDevice, registeredDevice);
    } catch (error) {
      if (!mountedRef.current) return;
      setErrorMessage(
        `${stage}: ${getDebugErrorMessage(error)}`,
      );
      setDevices((currentDevices) =>
        currentDevices.map((device) => ({
          ...device,
          status: device.id === selectedDevice.id ? (stage === "BLE 연결" ? "failed" : "setup-failed") : "idle",
        })),
      );
    } finally {
      connectingRef.current = false;
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-concierge-bg">
      <StatusBar style="dark" backgroundColor="#FAF6F1" />
      <View className="flex-1 px-6 pb-6 pt-6">
        <View className="flex-1">
          <ScreenHeader
            title="MXIS Charm을 찾고 있어요."
            titleClassName="text-[19px]"
            onBack={() => router.back()}
          />
          <Text className="mt-5 text-sm text-concierge-textSecondary">
            스마트폰 가까이에 두고 잠시만 기다려 주세요.
          </Text>

          <View
            className={`items-center justify-center overflow-visible ${
              hasEmptyResult ? "mt-40 mb-20 h-[200px]" : "mt-20 mb-10 h-[180px]"
            }`}
          >
            <Image
              source={charmOnboardingDevice}
              className={
                hasEmptyResult ? "h-[370px] w-[370px]" : "h-[280px] w-[280px]"
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
                Charm의 전원이 켜져 있는지 확인해 주세요
              </Text>
              {errorMessage ? (
                <Text className="mt-2 text-center text-xs font-medium text-[#C04737]">
                  {errorMessage}
                </Text>
              ) : null}
            </View>
          ) : (
            <ScrollView className="mt-4 flex-1" contentContainerClassName="gap-2 pb-4">
              {scanResultState === "scanning" && devices.length === 0 ? (
                <Text className="py-4 text-center text-sm text-concierge-textSecondary">
                  가까운 MXIS Charm을 검색하고 있습니다.
                </Text>
              ) : null}
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
          )}
        </View>

        <SearchBottomActions onSearchAgain={startScan} />
      </View>
    </SafeAreaView>
  );
}
