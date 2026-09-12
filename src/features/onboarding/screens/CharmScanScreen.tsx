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
  getBleErrorDetails,
  getBleDeviceName,
  getCharmScanServiceUuids,
  getSmartCharmBleManager,
  isVisibleCharmScanCandidate,
  resolveOrangeScanPolicy,
  waitForBluetoothReady,
  type SmartCharmConnectionStage,
} from "@/features/onboarding/ble/smartCharmBle";
import { collectSmartCharm, registerSmartCharmBackend } from "@/features/onboarding/ble/smartCharmSync";
import charmOnboardingDevice from "@/features/onboarding/assets/charm-onboarding-device.png";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { SecondaryButton } from "@/shared/components/SecondaryButton";

type CharmConnectionStatus =
  | "idle"
  | "ble-connecting"
  | "service-discovering"
  | "notify-subscribing"
  | "ping-checking"
  | "device-verifying"
  | "syncing"
  | "registering"
  | "ble-failed"
  | "setup-failed"
  | "server-failed";
type ScanResultState = "scanning" | "found" | "empty";

type CharmDevice = {
  id: string;
  name: string;
  serialNumber: string;
  macAddress?: string;
  serviceUUIDs: string[];
  status: CharmConnectionStatus;
  errorMessage?: string;
  bleDevice: BleDevice;
};

const DEFAULT_SCAN_TIMEOUT_SECONDS = 8;
const CONNECT_TIMEOUT_MS = 10000;

function getDebugErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "알 수 없는 오류";
}

function getConnectionStatus(stage: SmartCharmConnectionStage): CharmConnectionStatus {
  return {
    "BLE 연결 중": "ble-connecting",
    "서비스 검색 중": "service-discovering",
    "Notify 구독 중": "notify-subscribing",
    "PING 확인 중": "ping-checking",
    "기기 정보 확인 중": "device-verifying",
  }[stage] as CharmConnectionStatus;
}

function getFailureStatus(stage: string): CharmConnectionStatus {
  if (["BLE 연결 중", "서비스 검색 중", "Notify 구독 중", "PING 확인 중"].includes(stage)) return "ble-failed";
  if (stage === "서버 등록 중") return "server-failed";
  return "setup-failed";
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
  const isFailed = status === "ble-failed" || status === "setup-failed" || status === "server-failed";
  const color = isFailed ? "#A51F21" : "#814C27";
  const labels: Record<Exclude<CharmConnectionStatus, "idle">, string> = {
    "ble-connecting": "연결 중",
    "service-discovering": "기기 확인",
    "notify-subscribing": "기기 확인",
    "ping-checking": "기기 확인",
    "device-verifying": "기기 확인",
    syncing: "데이터 수신",
    registering: "서버 등록",
    "ble-failed": "연결 실패",
    "setup-failed": "연결 실패",
    "server-failed": "연결 실패",
  };
  const label = labels[status];

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
  disabled,
  isLast,
}: {
  device: CharmDevice;
  onPress: (device: CharmDevice) => void;
  disabled: boolean;
  isLast: boolean;
}) {
  const isFailed = device.status === "ble-failed" || device.status === "setup-failed" || device.status === "server-failed";
  const visibleStatus = device.status === "idle" ? null : device.status;
  const dotColor =
    isFailed
      ? "#A51F21"
      : device.status === "ble-connecting"
        ? "#E4AB7C"
        : "#898989";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => onPress(device)}
      className={`min-h-[56px] flex-row items-center gap-2.5 px-4 py-2.5 ${isLast ? "" : "border-b border-concierge-border"}`}
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
            className="mt-0.5 text-sm font-medium text-concierge-textSecondary"
            numberOfLines={2}
          >
            연결 실패했습니다. 다시 시도해주세요.
          </Text>
        ) : null}
      </View>

      {visibleStatus ? <StatusPill status={visibleStatus} /> : null}
    </Pressable>
  );
}

function SearchBottomActions({ onSearchAgain, disabled }: { onSearchAgain: () => void; disabled: boolean }) {
  return (
    <View className="gap-2">
      <SecondaryButton label="다시 검색" onPress={onSearchAgain} disabled={disabled} />
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
  const [isConnecting, setIsConnecting] = useState(false);
  const [scanResultState, setScanResultState] =
    useState<ScanResultState>("scanning");
  const [devices, setDevices] = useState<CharmDevice[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [allowedServiceUuids, setAllowedServiceUuids] = useState(DEFAULT_SMART_CHARM_SERVICE_UUIDS);
  const [policyReady, setPolicyReady] = useState(false);
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

    const receivedIds = new Set<string>();
    const visibleIds = new Set<string>();
    try {
      await waitForBluetoothReady(bleManagerRef.current);
      if (!mountedRef.current || scanRun !== scanRunRef.current) return;
      const serviceUuids = getCharmScanServiceUuids("service", allowedServiceUuids);
      console.log("[Charm BLE] scan started", { serviceUuids });
      await bleManagerRef.current.startDeviceScan(
        serviceUuids,
        { allowDuplicates: true },
        (error: BleError | null, scannedDevice: BleDevice | null) => {
          if (!mountedRef.current || scanRun !== scanRunRef.current) return;
          if (error) {
            console.warn("[Charm BLE] scan error", getBleErrorDetails(error));
            setScanResultState(visibleIds.size ? "found" : "empty");
            setErrorMessage(`Bluetooth 검색 오류 (${error.errorCode}): ${error.message}`);
            stopScan();
            return;
          }

          if (!scannedDevice) return;
          if (!receivedIds.has(scannedDevice.id) && __DEV__) {
            console.log("[Charm BLE] advertisement", {
              id: scannedDevice.id, name: getBleDeviceName(scannedDevice),
              serviceUUIDs: scannedDevice.serviceUUIDs ?? [],
            });
          }
          receivedIds.add(scannedDevice.id);
          if (!isVisibleCharmScanCandidate(scannedDevice, "service", allowedServiceUuids)) return;
          visibleIds.add(scannedDevice.id);
          setScanResultState("found");
          setDevices((currentDevices) => {
            const candidate: CharmDevice = {
              id: scannedDevice.id,
              name: getBleDeviceName(scannedDevice),
              serialNumber: getBleDeviceName(scannedDevice), // Display label only; ID command replaces it before registration.
              macAddress: scannedDevice.id,
              serviceUUIDs: scannedDevice.serviceUUIDs ?? [],
              status: "idle",
              bleDevice: scannedDevice,
            };
            const index = currentDevices.findIndex((device) => device.id === candidate.id);
            if (index < 0) return [...currentDevices, candidate];
            const previous = currentDevices[index];
            if (previous.name === candidate.name && previous.serviceUUIDs.join(",") === candidate.serviceUUIDs.join(",")) return currentDevices;
            return currentDevices.map((device, i) => i === index ? candidate : device);
          });
        },
      );
    } catch (error) {
      if (mountedRef.current && scanRun === scanRunRef.current) {
        console.error("[Charm BLE] scan start failed", getBleErrorDetails(error));
        setScanResultState("empty");
        setErrorMessage(getDebugErrorMessage(error));
        stopScan();
      }
      return;
    }
    if (!mountedRef.current || scanRun !== scanRunRef.current) return;
    scanTimerRef.current = setTimeout(() => {
      console.log("[Charm BLE] scan finished", { received: receivedIds.size, visible: visibleIds.size });
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
        console.log("[Charm BLE] server scan policy", { allowedServiceUuids: policy.allowedServiceUuids });
        try {
          const uuids = resolveOrangeScanPolicy(policy.allowedServiceUuids);
          setAllowedServiceUuids(uuids);
          console.log("[Charm BLE] scan policy", { source: "server", effectiveScanServiceUuids: uuids });
        } catch (error) {
          setAllowedServiceUuids(DEFAULT_SMART_CHARM_SERVICE_UUIDS);
          console.warn("[Charm BLE] incompatible server policy; local Orange UUID configuration used", {
            message: getDebugErrorMessage(error),
          });
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
  }, [policyReady, allowedServiceUuids.join(","), scanTimeoutSeconds]);
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
    if (!policyReady) {
      setErrorMessage("서버 검색 정책 확인 중입니다.");
      return;
    }
    if (!ownerId || !accessToken) {
      setErrorMessage("로그인 후 참을 연결해 주세요.");
      return;
    }
    connectingRef.current = true;
    setIsConnecting(true);
    handedOffRef.current = false;
    let stage = "BLE 연결 중";
    const updateStage = (name: string, status: CharmConnectionStatus) => {
      if (!mountedRef.current || String(useAuthStore.getState().user?.id ?? "") !== ownerId) throw new Error("연결 작업이 취소되었습니다.");
      stage = name;
      setDevices((items) => items.map((item) => item.id === selectedDevice.id ? { ...item, status, errorMessage: undefined } : item));
    };
    const stopped = stopScan();
    setScanResultState("found");
    setErrorMessage("");
    setDevices((currentDevices) =>
      currentDevices.map((device) => ({
        ...device,
        status: device.id === selectedDevice.id ? "ble-connecting" : "idle",
        errorMessage: undefined,
      })),
    );

    try {
      await stopped;
      const connection = await connectSmartCharm(selectedDevice.id, ownerId, {
        timeoutMs: CONNECT_TIMEOUT_MS,
        allowedServiceUuids,
        onStage: (name) => updateStage(name, getConnectionStatus(name)),
      });
      const resolvedDevice = { ...selectedDevice, serialNumber: connection.serialNumber };
      updateStage("센서 데이터 동기화 중", "syncing");
      const sync = await collectSmartCharm(connection);
      console.log("[Charm BLE] SYNC verified", { count: sync.readings.length, through: sync.through, dropped: sync.after.dropped });
      updateStage("서버 등록 중", "registering");
      const registeredDevice = await runBleDebugStep("서버 기기 등록", () => registerConnectedDevice(resolvedDevice, connection.serialNumber));
      if (registeredDevice.serialNumber !== connection.serialNumber) throw new Error("서버가 반환한 참 ID가 실제 기기와 다릅니다.");
      await registerSmartCharmBackend(ownerId, connection.serialNumber, registeredDevice.id);
      updateStage("실시간 센서 수신 시작 중", "syncing");
      console.log("[Charm BLE] LIVE ON start");
      await connection.session.setLive(true);
      console.log("[Charm BLE] LIVE ON success");
      await queryClient.invalidateQueries({ queryKey: ["device"] });
      handedOffRef.current = true;
      moveToConnectedScreen(resolvedDevice, registeredDevice);
    } catch (error) {
      if (!mountedRef.current) return;
      console.error("[Charm BLE] setup failed:", { stage, error });
      const userErrorMessage = getDebugErrorMessage(error).includes("다른 앱의 연결")
        ? "다른 Bluetooth 앱의 연결을 종료하고 다시 시도해 주세요."
        : "참 연결에 실패했습니다. 다시 시도해 주세요.";
      setErrorMessage(userErrorMessage);
      const failureStatus = getFailureStatus(stage);
      setDevices((currentDevices) =>
        currentDevices.map((device) => ({
          ...device,
          status: device.id === selectedDevice.id ? failureStatus : "idle",
          errorMessage: device.id === selectedDevice.id ? userErrorMessage : undefined,
        })),
      );
    } finally {
      if (!handedOffRef.current) await disconnectSmartCharmConnection();
      connectingRef.current = false;
      if (mountedRef.current) setIsConnecting(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-concierge-bg">
      <StatusBar style="dark" backgroundColor="#FAF6F1" />
      <View className="flex-1 px-6 pb-6 pt-6">
        <View className="flex-1">
          <ScreenHeader
            title="MXIS Charm을 찾고 있어요."
            titleClassName="text-2xl"
            onBack={() => router.back()}
          />
          <Text className="mt-2 text-sm font-medium text-concierge-textSecondary">
            스마트폰 가까이에 두고 잠시만 기다려 주세요.
          </Text>

          <View className="h-[286px] items-center justify-center">
            <Image
              source={charmOnboardingDevice}
              className="h-[286px] w-[286px]"
              resizeMode="contain"
            />
          </View>

          <ScrollView className="flex-1" contentContainerClassName="pb-4">
            {errorMessage ? (
              <Text accessibilityLiveRegion="polite" className="mb-2 text-center text-xs font-medium text-[#C04737]">
                {errorMessage}
              </Text>
            ) : null}
            {hasEmptyResult ? (
              <View className="items-center py-4">
                <Text className="text-center text-base font-bold text-concierge-primary">
                  {errorMessage ? "검색을 완료하지 못했어요" : "연결 가능한 참을 찾을 수 없어요"}
                </Text>
                {!errorMessage ? (
                  <Text className="mt-1.5 text-center text-sm font-semibold text-concierge-textSecondary">
                    Charm의 전원이 켜져 있는지 확인해 주세요
                  </Text>
                ) : null}
              </View>
            ) : null}
            {scanResultState === "scanning" && devices.length === 0 ? (
              <Text className="py-4 text-center text-sm text-concierge-textSecondary">
                {!policyReady ? "검색 준비 중" : "가까운 MXIS Charm을 검색하고 있습니다."}
              </Text>
            ) : null}
            {devices.length > 0 ? (
              <View className="overflow-hidden rounded-[10px] bg-white">
                {devices.map((device, index) => (
                  <CharmDeviceCard
                    key={device.id}
                    device={device}
                    onPress={handleConnectDevice}
                    disabled={isConnecting}
                    isLast={index === devices.length - 1}
                  />
                ))}
              </View>
            ) : null}
          </ScrollView>
        </View>

        <SearchBottomActions onSearchAgain={() => { void startScan(); }} disabled={!policyReady || isConnecting} />
      </View>
    </SafeAreaView>
  );
}
