import {
  getDevices,
  registerDevice,
  type DeviceResponse,
} from "@/features/onboarding/api/onboardingApi";
import {
  connectSmartCharm,
  type SmartCharmConnectionStage,
} from "@/features/onboarding/ble/smartCharmBle";
import {
  collectSmartCharm,
  registerSmartCharmBackend,
} from "@/features/onboarding/ble/smartCharmSync";
import type {
  CharmConnectionStatus,
  ScannedCharmDevice,
} from "@/features/onboarding/types";
import { logCharmDebug } from "@/features/onboarding/utils/charmLogger";

const CONNECT_TIMEOUT_MS = 10000;

type SetupOptions = {
  accessToken: string;
  allowedServiceUuids: string[];
  ownerId: string;
  selectedDevice: ScannedCharmDevice;
  tokenType: string;
  onStage: (name: string, status: CharmConnectionStatus) => void;
};

function getConnectionStatus(
  stage: SmartCharmConnectionStage,
): CharmConnectionStatus {
  return {
    "BLE 연결 중": "ble-connecting",
    "서비스 검색 중": "service-discovering",
    "Notify 구독 중": "notify-subscribing",
    "PING 확인 중": "ping-checking",
    "기기 정보 확인 중": "device-verifying",
  }[stage] as CharmConnectionStatus;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "알 수 없는 오류";
}

async function runSetupStep<T>(stepName: string, action: () => Promise<T>) {
  logCharmDebug(`[Charm BLE] ${stepName} start`);

  try {
    const result = await action();
    logCharmDebug(`[Charm BLE] ${stepName} success`);
    return result;
  } catch (error) {
    console.error(`[Charm BLE] ${stepName} failed`, error);
    throw new Error(`${stepName} 실패: ${getErrorMessage(error)}`);
  }
}

async function registerConnectedDevice(
  selectedDevice: ScannedCharmDevice,
  smartCharmDeviceId: string,
  accessToken: string,
  tokenType: string,
) {
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
    const ownedDevices = await getDevices(accessToken, tokenType).catch(() => {
      throw registrationError;
    });
    const existingDevice = ownedDevices.find(
      (device) => device.serialNumber === smartCharmDeviceId,
    );

    if (!existingDevice) throw registrationError;
    return existingDevice;
  }
}

export async function connectAndRegisterCharm({
  accessToken,
  allowedServiceUuids,
  ownerId,
  selectedDevice,
  tokenType,
  onStage,
}: SetupOptions): Promise<{
  registeredDevice: DeviceResponse;
  resolvedDevice: ScannedCharmDevice;
}> {
  const connection = await connectSmartCharm(selectedDevice.id, ownerId, {
    timeoutMs: CONNECT_TIMEOUT_MS,
    allowedServiceUuids,
    onStage: (name) => onStage(name, getConnectionStatus(name)),
  });
  const resolvedDevice = {
    ...selectedDevice,
    serialNumber: connection.serialNumber,
  };

  onStage("센서 데이터 동기화 중", "syncing");
  const sync = await collectSmartCharm(connection);
  logCharmDebug("[Charm BLE] SYNC verified", {
    count: sync.readings.length,
    through: sync.through,
    dropped: sync.after.dropped,
  });

  onStage("서버 등록 중", "registering");
  const registeredDevice = await runSetupStep("서버 기기 등록", () =>
    registerConnectedDevice(
      resolvedDevice,
      connection.serialNumber,
      accessToken,
      tokenType,
    ),
  );

  if (registeredDevice.serialNumber !== connection.serialNumber) {
    throw new Error("서버가 반환한 참 ID가 실제 기기와 다릅니다.");
  }

  await registerSmartCharmBackend(
    ownerId,
    connection.serialNumber,
    registeredDevice.id,
  );
  onStage("실시간 센서 수신 시작 중", "syncing");
  logCharmDebug("[Charm BLE] LIVE ON start");
  await connection.session.setLive(true);
  logCharmDebug("[Charm BLE] LIVE ON success");

  return { registeredDevice, resolvedDevice };
}
