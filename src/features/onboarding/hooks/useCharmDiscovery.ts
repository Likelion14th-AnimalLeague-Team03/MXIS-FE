import { useCallback, useEffect, useRef, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import type { BleError, Device as BleDevice } from "react-native-ble-plx";

import {
  getBleDeviceName,
  getBleErrorDetails,
  getCharmScanServiceUuids,
  getSmartCharmBleManager,
  isVisibleCharmScanCandidate,
  waitForBluetoothReady,
} from "@/features/onboarding/ble/smartCharmBle";
import type {
  CharmScanResult,
  ScannedCharmDevice,
} from "@/features/onboarding/types";
import { logCharmDebug } from "@/features/onboarding/utils/charmLogger";

type Options = {
  allowedServiceUuids: string[];
  connectingRef: { current: boolean };
  mountedRef: { current: boolean };
  policyReady: boolean;
  scanTimeoutSeconds: number;
};

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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "알 수 없는 오류";
}

function mergeScannedDevice(
  currentDevices: ScannedCharmDevice[],
  scannedDevice: BleDevice,
) {
  const deviceName = getBleDeviceName(scannedDevice);
  const candidate: ScannedCharmDevice = {
    id: scannedDevice.id,
    name: deviceName,
    // The ID command replaces this display label before registration.
    serialNumber: deviceName,
    macAddress: scannedDevice.id,
    serviceUUIDs: scannedDevice.serviceUUIDs ?? [],
    status: "idle",
    bleDevice: scannedDevice,
  };
  const index = currentDevices.findIndex(
    (device) => device.id === candidate.id,
  );

  if (index < 0) return [...currentDevices, candidate];

  const previous = currentDevices[index];
  if (
    previous.name === candidate.name &&
    previous.serviceUUIDs.join(",") === candidate.serviceUUIDs.join(",")
  ) {
    return currentDevices;
  }

  return currentDevices.map((device, deviceIndex) =>
    deviceIndex === index ? candidate : device,
  );
}

export function useCharmDiscovery({
  allowedServiceUuids,
  connectingRef,
  mountedRef,
  policyReady,
  scanTimeoutSeconds,
}: Options) {
  const bleManagerRef = useRef(getSmartCharmBleManager());
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanRunRef = useRef(0);
  const [scanResult, setScanResult] = useState<CharmScanResult>("scanning");
  const [devices, setDevices] = useState<ScannedCharmDevice[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const stopScan = useCallback(() => {
    scanRunRef.current++;
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    return bleManagerRef.current.stopDeviceScan().catch(() => undefined);
  }, []);

  const startScan = useCallback(async () => {
    if (!policyReady || connectingRef.current) return;

    const stopped = stopScan();
    const scanRun = scanRunRef.current;
    await stopped;
    if (!mountedRef.current || scanRun !== scanRunRef.current) return;

    setDevices([]);
    setErrorMessage("");
    setScanResult("scanning");

    const hasPermission = await ensureAndroidBluetoothPermissions().catch(
      () => false,
    );
    if (!mountedRef.current || scanRun !== scanRunRef.current) return;
    if (!hasPermission) {
      setScanResult("empty");
      setErrorMessage(
        "MXIS Charm을 찾으려면 Bluetooth 권한 허용이 필요합니다.",
      );
      return;
    }

    const receivedIds = new Set<string>();
    const visibleIds = new Set<string>();
    try {
      await waitForBluetoothReady(bleManagerRef.current);
      if (!mountedRef.current || scanRun !== scanRunRef.current) return;

      const serviceUuids = getCharmScanServiceUuids(
        "service",
        allowedServiceUuids,
      );
      logCharmDebug("[Charm BLE] scan started", { serviceUuids });
      await bleManagerRef.current.startDeviceScan(
        serviceUuids,
        { allowDuplicates: true },
        (error: BleError | null, scannedDevice: BleDevice | null) => {
          if (!mountedRef.current || scanRun !== scanRunRef.current) return;
          if (error) {
            console.warn("[Charm BLE] scan error", getBleErrorDetails(error));
            setScanResult(visibleIds.size ? "found" : "empty");
            setErrorMessage(
              `Bluetooth 검색 오류 (${error.errorCode}): ${error.message}`,
            );
            void stopScan();
            return;
          }
          if (!scannedDevice) return;

          if (!receivedIds.has(scannedDevice.id) && __DEV__) {
            logCharmDebug("[Charm BLE] advertisement", {
              id: scannedDevice.id,
              name: getBleDeviceName(scannedDevice),
              serviceUUIDs: scannedDevice.serviceUUIDs ?? [],
            });
          }
          receivedIds.add(scannedDevice.id);

          if (
            !isVisibleCharmScanCandidate(
              scannedDevice,
              "service",
              allowedServiceUuids,
            )
          ) {
            return;
          }

          visibleIds.add(scannedDevice.id);
          setScanResult("found");
          setDevices((currentDevices) =>
            mergeScannedDevice(currentDevices, scannedDevice),
          );
        },
      );
    } catch (error) {
      if (mountedRef.current && scanRun === scanRunRef.current) {
        console.error("[Charm BLE] scan start failed", getBleErrorDetails(error));
        setScanResult("empty");
        setErrorMessage(getErrorMessage(error));
        void stopScan();
      }
      return;
    }

    if (!mountedRef.current || scanRun !== scanRunRef.current) return;
    scanTimerRef.current = setTimeout(() => {
      logCharmDebug("[Charm BLE] scan finished", {
        received: receivedIds.size,
        visible: visibleIds.size,
      });
      void stopScan();
      setScanResult((current) => (current === "found" ? "found" : "empty"));
    }, scanTimeoutSeconds * 1000);
  }, [
    allowedServiceUuids,
    connectingRef,
    mountedRef,
    policyReady,
    scanTimeoutSeconds,
    stopScan,
  ]);

  useEffect(() => {
    void startScan();
    return () => {
      void stopScan();
    };
  }, [startScan, stopScan]);

  return {
    devices,
    errorMessage,
    scanResult,
    setDevices,
    setErrorMessage,
    setScanResult,
    startScan,
    stopScan,
  };
}
