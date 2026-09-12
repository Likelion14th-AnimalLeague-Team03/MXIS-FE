import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/authStore";
import { deviceQueryKeys } from "@/features/device/queryKeys";
import { disconnectSmartCharmConnection } from "@/features/onboarding/ble/smartCharmBle";
import { connectAndRegisterCharm } from "@/features/onboarding/services/connectAndRegisterCharm";
import type {
  CharmConnectionStatus,
  ScannedCharmDevice,
} from "@/features/onboarding/types";
import { useCharmDiscovery } from "./useCharmDiscovery";
import { useCharmScanPolicy } from "./useCharmScanPolicy";

type Options = {
  accessToken: string | null;
  ownerId: string;
  tokenType: string;
  onConnected: (
    device: ScannedCharmDevice,
    registeredDeviceId: number,
    registeredSerialNumber: string,
  ) => void;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "알 수 없는 오류";
}

function getFailureStatus(stage: string): CharmConnectionStatus {
  if (
    ["BLE 연결 중", "서비스 검색 중", "Notify 구독 중", "PING 확인 중"].includes(
      stage,
    )
  ) {
    return "ble-failed";
  }
  if (stage === "서버 등록 중") return "server-failed";
  return "setup-failed";
}

export function useCharmScanController({
  accessToken,
  ownerId,
  tokenType,
  onConnected,
}: Options) {
  const queryClient = useQueryClient();
  const mountedRef = useRef(true);
  const connectingRef = useRef(false);
  const handedOffRef = useRef(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { allowedServiceUuids, policyReady, scanTimeoutSeconds } =
    useCharmScanPolicy();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (connectingRef.current && !handedOffRef.current) {
        void disconnectSmartCharmConnection();
      }
    };
  }, []);

  const {
    devices,
    errorMessage,
    scanResult,
    setDevices,
    setErrorMessage,
    setScanResult,
    startScan,
    stopScan,
  } = useCharmDiscovery({
    allowedServiceUuids,
    connectingRef,
    mountedRef,
    policyReady,
    scanTimeoutSeconds,
  });

  const connectDevice = async (selectedDevice: ScannedCharmDevice) => {
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
      const currentOwnerId = String(useAuthStore.getState().user?.id ?? "");
      if (!mountedRef.current || currentOwnerId !== ownerId) {
        throw new Error("연결 작업이 취소되었습니다.");
      }
      stage = name;
      setDevices((currentDevices) =>
        currentDevices.map((device) =>
          device.id === selectedDevice.id
            ? { ...device, status, errorMessage: undefined }
            : device,
        ),
      );
    };

    const stopped = stopScan();
    setScanResult("found");
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
      const { registeredDevice, resolvedDevice } =
        await connectAndRegisterCharm({
          accessToken,
          allowedServiceUuids,
          ownerId,
          selectedDevice,
          tokenType,
          onStage: updateStage,
        });
      await queryClient.invalidateQueries({ queryKey: deviceQueryKeys.all });
      handedOffRef.current = true;
      onConnected(
        resolvedDevice,
        registeredDevice.id,
        registeredDevice.serialNumber,
      );
    } catch (error) {
      if (!mountedRef.current) return;
      console.error("[Charm BLE] setup failed:", { stage, error });
      const userErrorMessage = getErrorMessage(error).includes("다른 앱의 연결")
        ? "다른 Bluetooth 앱의 연결을 종료하고 다시 시도해 주세요."
        : "참 연결에 실패했습니다. 다시 시도해 주세요.";
      setErrorMessage(userErrorMessage);
      const failureStatus = getFailureStatus(stage);
      setDevices((currentDevices) =>
        currentDevices.map((device) => ({
          ...device,
          status: device.id === selectedDevice.id ? failureStatus : "idle",
          errorMessage:
            device.id === selectedDevice.id ? userErrorMessage : undefined,
        })),
      );
    } finally {
      if (!handedOffRef.current) await disconnectSmartCharmConnection();
      connectingRef.current = false;
      if (mountedRef.current) setIsConnecting(false);
    }
  };

  return {
    connectDevice,
    devices,
    errorMessage,
    hasEmptyResult: scanResult === "empty",
    isConnecting,
    policyReady,
    scanResult,
    startScan,
  };
}
