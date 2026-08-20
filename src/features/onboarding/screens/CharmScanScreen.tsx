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
import { BleError, BleManager, type Device as BleDevice } from "react-native-ble-plx";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useDeviceStore } from "@/features/device/store";
import {
  getConnectionPolicy,
  getDevices,
  registerDevice,
  type DeviceResponse,
  type SensorReadingUploadItem,
} from "@/features/onboarding/api/onboardingApi";
import { savePendingSensorReadings } from "@/features/onboarding/storage";
import {
  decodeSensorReading,
  decodeUint16LittleEndian,
  decodeUint32LittleEndian,
  DROPPED_READING_COUNT_CHARACTERISTIC_UUID,
  getBleDeviceName,
  getBleFallbackSerialNumber,
  isSmartCharmDevice,
  PENDING_COUNT_CHARACTERISTIC_UUID,
  readSmartCharmDeviceId,
  SENSOR_READING_CHARACTERISTIC_UUID,
  SMART_CHARM_SERVICE_UUID,
  writeTimeSync,
} from "@/features/onboarding/ble/smartCharmBle";
import charmOnboardingDevice from "@/features/onboarding/assets/charm-onboarding-device.png";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { SecondaryButton } from "@/shared/components/SecondaryButton";

type CharmConnectionStatus = "idle" | "connecting" | "failed";
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
const INITIAL_SYNC_COLLECT_MS = 15000;

function wait(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function collectSensorReading(
  base64Value: string,
  readingMap: Map<number, SensorReadingUploadItem>,
) {
  const reading = decodeSensorReading(base64Value);
  readingMap.set(reading.sequence, reading);
}

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
  device: CharmDevice;
  onPress: (device: CharmDevice) => void;
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
          {device.serialNumber}
        </Text>
        {isFailed ? (
          <Text
            className="mt-0.5 text-xs font-medium text-concierge-textSecondary"
            numberOfLines={1}
          >
            연결이 중단되었습니다. 다시 시도해주세요.
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
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const accessToken = useAuthStore((state) => state.accessToken);
  const tokenType = useAuthStore((state) => state.tokenType);
  const addOwnedCharm = useDeviceStore((state) => state.addOwnedCharm);
  const bleManagerRef = useRef(new BleManager());
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scanResultState, setScanResultState] =
    useState<ScanResultState>("scanning");
  const [devices, setDevices] = useState<CharmDevice[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [allowedServiceUuids, setAllowedServiceUuids] = useState([
    SMART_CHARM_SERVICE_UUID,
  ]);
  const [scanTimeoutSeconds, setScanTimeoutSeconds] = useState(
    DEFAULT_SCAN_TIMEOUT_SECONDS,
  );

  const hasEmptyResult = scanResultState === "empty";

  const stopScan = () => {
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    bleManagerRef.current.stopDeviceScan();
  };

  const startScan = async () => {
    stopScan();
    setDevices([]);
    setErrorMessage("");
    setScanResultState("scanning");

    const hasPermission = await ensureAndroidBluetoothPermissions();
    if (!hasPermission) {
      setScanResultState("empty");
      setErrorMessage("MXIS Charm을 찾으려면 Bluetooth 권한 허용이 필요합니다.");
      return;
    }

    bleManagerRef.current.startDeviceScan(
      allowedServiceUuids,
      { allowDuplicates: false },
      (error: BleError | null, scannedDevice: BleDevice | null) => {
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
              serialNumber: getBleFallbackSerialNumber(scannedDevice),
              macAddress: scannedDevice.id,
              serviceUUIDs: scannedDevice.serviceUUIDs ?? [],
              status: "idle",
              bleDevice: scannedDevice,
            },
          ];
        });
      },
    );

    scanTimerRef.current = setTimeout(() => {
      bleManagerRef.current.stopDeviceScan();
      setScanResultState((current) =>
        current === "found" ? "found" : "empty",
      );
    }, scanTimeoutSeconds * 1000);
  };

  useEffect(() => {
    getConnectionPolicy()
      .then((policy) => {
        setAllowedServiceUuids(
          policy.allowedServiceUuids?.length
            ? policy.allowedServiceUuids
            : [SMART_CHARM_SERVICE_UUID],
        );
        setScanTimeoutSeconds(
          policy.scanTimeoutSeconds || DEFAULT_SCAN_TIMEOUT_SECONDS,
        );
      })
      .catch(() => {
        setAllowedServiceUuids([SMART_CHARM_SERVICE_UUID]);
      });
  }, []);

  useEffect(() => {
    startScan();

    return () => {
      stopScan();
    };
    // 정책 API에서 받은 Service UUID와 timeout이 바뀌면 스캔을 다시 시작합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedServiceUuids.join(","), scanTimeoutSeconds]);

  const syncInitialSensorReadings = async (
    connectedDevice: BleDevice,
  ) => {

    await runBleDebugStep("TimeSync 쓰기", () =>
      writeTimeSync(connectedDevice),
    );

    const readingMap = new Map<number, SensorReadingUploadItem>();
    const sensorSubscription = connectedDevice.monitorCharacteristicForService(
      SMART_CHARM_SERVICE_UUID,
      SENSOR_READING_CHARACTERISTIC_UUID,
      (_error, characteristic) => {
        if (!characteristic?.value) return;

        try {
          collectSensorReading(characteristic.value, readingMap);
        } catch {
          // 잘못된 패킷은 ACK하지 않고 무시합니다.
        }
      },
    );
    const pendingSubscription = connectedDevice.monitorCharacteristicForService(
      SMART_CHARM_SERVICE_UUID,
      PENDING_COUNT_CHARACTERISTIC_UUID,
      (_error, characteristic) => {
        if (!characteristic?.value) return;

        try {
          decodeUint16LittleEndian(characteristic.value);
        } catch {
          // PendingCount is only used for development/debug state here.
        }
      },
    );
    const droppedSubscription = connectedDevice.monitorCharacteristicForService(
      SMART_CHARM_SERVICE_UUID,
      DROPPED_READING_COUNT_CHARACTERISTIC_UUID,
      (_error, characteristic) => {
        if (!characteristic?.value) return;

        try {
          decodeUint32LittleEndian(characteristic.value);
        } catch {
          // 개발/디버그 UI가 생기면 여기 값을 노출하면 됩니다.
        }
      },
    );

    await Promise.allSettled([
      connectedDevice
        .readCharacteristicForService(
          SMART_CHARM_SERVICE_UUID,
          SENSOR_READING_CHARACTERISTIC_UUID,
        )
        .then((characteristic) => {
          if (characteristic.value) {
            collectSensorReading(characteristic.value, readingMap);
          }
        }),
      connectedDevice
        .readCharacteristicForService(
          SMART_CHARM_SERVICE_UUID,
          PENDING_COUNT_CHARACTERISTIC_UUID,
        )
        .then((characteristic) => {
          if (characteristic.value) {
            decodeUint16LittleEndian(characteristic.value);
          }
        }),
      connectedDevice
        .readCharacteristicForService(
          SMART_CHARM_SERVICE_UUID,
          DROPPED_READING_COUNT_CHARACTERISTIC_UUID,
        )
        .then((characteristic) => {
          if (characteristic.value) {
            decodeUint32LittleEndian(characteristic.value);
          }
        }),
    ]);

    await wait(INITIAL_SYNC_COLLECT_MS);

    sensorSubscription.remove();
    pendingSubscription.remove();
    droppedSubscription.remove();

    const readings = [...readingMap.values()].sort(
      (first, second) => first.sequence - second.sequence,
    );

    console.log("[Charm BLE] SensorReading collected", readings);

    return readings;
  };
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
    } catch {
      const ownedDevices = await getDevices(accessToken, tokenType);
      const existingDevice = ownedDevices.find(
        (device) => device.serialNumber === smartCharmDeviceId,
      );

      if (!existingDevice) {
        throw new Error("MXIS Charm 등록에 실패했습니다.");
      }

      return existingDevice;
    }
  };

  const handleConnectDevice = async (selectedDevice: CharmDevice) => {
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
      const connectedDevice = await runBleDebugStep("BLE 연결", () =>
        selectedDevice.bleDevice.connect({
          timeout: CONNECT_TIMEOUT_MS,
        }),
      );
      await runBleDebugStep("서비스 검색", () =>
        connectedDevice.discoverAllServicesAndCharacteristics(),
      );

      const smartCharmDeviceId = await runBleDebugStep("DeviceId 읽기", () =>
        readSmartCharmDeviceId(connectedDevice),
      );
      const resolvedDevice = {
        ...selectedDevice,
        serialNumber: smartCharmDeviceId,
      };
      const registeredDevice = await runBleDebugStep(
        "백엔드 참 등록",
        () => registerConnectedDevice(resolvedDevice, smartCharmDeviceId),
      );

      const initialReadings = await runBleDebugStep("초기 센서 수집", () =>
        syncInitialSensorReadings(connectedDevice),
      );
      await savePendingSensorReadings(String(registeredDevice.id), initialReadings);
      moveToConnectedScreen(resolvedDevice, registeredDevice);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "MXIS Charm 연결에 실패했습니다.",
      );
      setDevices((currentDevices) =>
        currentDevices.map((device) => ({
          ...device,
          status: device.id === selectedDevice.id ? "failed" : "idle",
        })),
      );
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

