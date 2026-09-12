import { BleManager, type BleError, type Device as BleDevice } from "react-native-ble-plx";
import {
  DEFAULT_SMART_CHARM_SERVICE_UUIDS,
  normalizeUuid,
  SMART_CHARM_NUS_NOTIFY_CHARACTERISTIC_UUID,
  SMART_CHARM_NUS_SERVICE_UUID,
  SMART_CHARM_NUS_WRITE_CHARACTERISTIC_UUID,
} from "./smartCharmProtocol";
import { createUartSession, type SmartCharmUartSession } from "./smartCharmUartSession";
import { logCharmDebug } from "../utils/charmLogger";

export * from "./smartCharmProtocol";
export type { SmartCharmUartSession } from "./smartCharmUartSession";

let manager: BleManager | undefined;
export function getSmartCharmBleManager() {
  manager ??= new BleManager();
  return manager;
}

export function getBleDeviceName(device: Pick<BleDevice, "localName" | "name">) {
  return device.localName || device.name || "이름 없는 BLE 기기";
}

// This is a candidate filter, not product authentication. No name-based bypass.
export function isSmartCharmDevice(device: Pick<BleDevice, "serviceUUIDs">, allowedServiceUuids: string[]) {
  const allowed = allowedServiceUuids.map(normalizeUuid);
  return (device.serviceUUIDs ?? []).some((uuid) => allowed.includes(normalizeUuid(uuid)));
}

export function hasSmartCharmName(device: Pick<BleDevice, "localName" | "name">) {
  const name = (device.localName || device.name || "").toLowerCase().replace(/[\s_-]/g, "");
  return name.startsWith("smartcharm") || name.startsWith("mxis") || name.startsWith("scob");
}

export type CharmScanMode = "service" | "nearby";

export type SmartCharmConnectionStage =
  | "BLE 연결 중"
  | "서비스 검색 중"
  | "Notify 구독 중"
  | "PING 확인 중"
  | "기기 정보 확인 중";

export function getBleErrorDetails(error: unknown) {
  const bleError = error as Partial<BleError> | null | undefined;
  return {
    errorCode: bleError?.errorCode ?? null,
    message: error instanceof Error ? error.message : String(error),
    reason: bleError?.reason ?? null,
    attErrorCode: bleError?.attErrorCode ?? null,
    androidErrorCode: bleError?.androidErrorCode ?? null,
  };
}

function logBleFailure(stage: string, error: unknown) {
  console.error(`[Charm BLE] ${stage} failed`, getBleErrorDetails(error));
}

function connectionErrorForUser(error: unknown) {
  const details = getBleErrorDetails(error);
  const message = `${details.message} ${details.reason ?? ""}`;
  if (details.errorCode === 200 || /already connected|connection failed|133|busy/i.test(message)) {
    return new Error("참에 연결할 수 없습니다. nRF Connect 등 다른 앱의 연결을 종료하고 다시 시도해 주세요.");
  }
  return error instanceof Error ? error : new Error(details.message);
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export function getCharmScanServiceUuids(mode: CharmScanMode, allowed: string[]) {
  if (mode === "nearby") return null;
  resolveOrangeScanPolicy(allowed);
  // Some Orange boards do not include their UART service UUID in advertisements.
  // Scan broadly, then verify the actual GATT service before registration.
  return null;
}

export function isVisibleCharmScanCandidate(
  device: Pick<BleDevice, "serviceUUIDs" | "localName" | "name">,
  mode: CharmScanMode,
  allowed: string[],
) {
  return mode === "nearby" || isSmartCharmDevice(device, allowed) || hasSmartCharmName(device);
}

export function waitForBluetoothReady(
  bleManager: Pick<BleManager, "onStateChange">,
  timeoutMs = 4000,
) {
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    let subscription: { remove(): void } | undefined;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      subscription?.remove();
      if (error) reject(error);
      else resolve();
    };
    const timer = setTimeout(() => finish(new Error("Bluetooth 초기화가 지연되고 있습니다. 다시 검색해 주세요.")), timeoutMs);
    try {
      subscription = bleManager.onStateChange((state) => {
        if (state === "PoweredOn") finish();
        else if (state === "PoweredOff") finish(new Error("휴대폰의 Bluetooth를 켠 뒤 다시 검색해 주세요."));
        else if (state === "Unauthorized") finish(new Error("휴대폰 설정에서 Bluetooth 권한을 허용해 주세요."));
        else if (state === "Unsupported") finish(new Error("이 기기는 Bluetooth LE를 지원하지 않습니다."));
      }, true);
      if (settled) subscription.remove();
    } catch (error) {
      finish(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

export function resolveOrangeScanPolicy(allowed?: string[]) {
  const uuids = allowed ?? DEFAULT_SMART_CHARM_SERVICE_UUIDS;
  if (!Array.isArray(uuids) || !uuids.length || !uuids.every((uuid) =>
    typeof uuid === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid))) {
    throw new Error("서버의 Bluetooth 검색 설정을 확인해 주세요.");
  }
  const uart = uuids.filter((uuid) => !/^8a1000[0-9a-f]{2}-/i.test(uuid));
  if (!uart.length) throw new Error("서버에 이전 센서의 검색 설정만 등록되어 있습니다.");
  const seen = new Set<string>();
  return uart.filter((uuid) => {
    const normalized = normalizeUuid(uuid);
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

export async function createSmartCharmUartSession(
  device: BleDevice,
  allowedServiceUuids = DEFAULT_SMART_CHARM_SERVICE_UUIDS,
): Promise<SmartCharmUartSession> {
  const allowed = new Set(
    resolveOrangeScanPolicy(allowedServiceUuids).map(normalizeUuid),
  );
  const services = await device.services();
  services.forEach((service) => logCharmDebug("[Charm BLE] service discovered:", service.uuid));

  const nusUuid = normalizeUuid(SMART_CHARM_NUS_SERVICE_UUID);
  const orderedServices = [
    ...services.filter((service) => normalizeUuid(service.uuid) === nusUuid),
    ...services.filter((service) => normalizeUuid(service.uuid) !== nusUuid && allowed.has(normalizeUuid(service.uuid))),
    ...services.filter((service) => normalizeUuid(service.uuid) !== nusUuid && !allowed.has(normalizeUuid(service.uuid))),
  ];
  const routes: Array<{
    service: Awaited<ReturnType<BleDevice["services"]>>[number];
    write: Awaited<ReturnType<BleDevice["characteristicsForService"]>>[number];
    notify: Awaited<ReturnType<BleDevice["characteristicsForService"]>>[number];
  }> = [];

  for (const service of orderedServices) {
    const characteristics = await device.characteristicsForService(service.uuid);
    characteristics.forEach((characteristic) => logCharmDebug("[Charm BLE] characteristic discovered:", {
      serviceUuid: service.uuid,
      uuid: characteristic.uuid,
      isWritableWithResponse: characteristic.isWritableWithResponse,
      isWritableWithoutResponse: characteristic.isWritableWithoutResponse,
      isNotifiable: characteristic.isNotifiable,
      isIndicatable: characteristic.isIndicatable,
    }));
    const writes = characteristics.filter((item) => item.isWritableWithResponse || item.isWritableWithoutResponse);
    const notifications = characteristics.filter((item) => item.isNotifiable);
    const preferredWrite = writes.find((item) => normalizeUuid(item.uuid) === normalizeUuid(SMART_CHARM_NUS_WRITE_CHARACTERISTIC_UUID));
    const preferredNotify = notifications.find((item) => normalizeUuid(item.uuid) === normalizeUuid(SMART_CHARM_NUS_NOTIFY_CHARACTERISTIC_UUID));
    const write = preferredWrite ?? (writes.length === 1 ? writes[0] : undefined);
    const notify = preferredNotify ?? (notifications.length === 1 ? notifications[0] : undefined);
    if (write && notify) {
      const route = { service, write, notify };
      if (normalizeUuid(service.uuid) === nusUuid && preferredWrite && preferredNotify) {
        routes.unshift(route);
        break;
      }
      routes.push(route);
    }
  }

  if (!routes.length) throw new Error("센서의 Nordic UART 쓰기·Notify 경로를 찾을 수 없습니다.");
  const { service, write, notify } = routes[0];
  logCharmDebug("[Charm BLE] UART route selected:", {
    serviceUuid: service.uuid,
    writeUuid: write.uuid,
    notifyUuid: notify.uuid,
  });

  return createUartSession({
    write: async (value) => {
      if (write.isWritableWithResponse) {
        try {
          return await device.writeCharacteristicWithResponseForService(service.uuid, write.uuid, value);
        } catch (error) {
          logBleFailure("Write With Response", error);
          if (!write.isWritableWithoutResponse) throw error;
          console.warn("[Charm BLE] retrying with Write Without Response");
        }
      }
      return device.writeCharacteristicWithoutResponseForService(service.uuid, write.uuid, value);
    },
    subscribe: (onValue, onError) => {
      logCharmDebug("[Charm BLE] notify subscription requested");
      let active = true;
      const subscription = device.monitorCharacteristicForService(service.uuid, notify.uuid, (error, item) => {
        if (!active) return;
        if (error) {
          logBleFailure("Notify", error);
          onError(error);
        }
        else if (item?.value != null) onValue(item.value);
      });
      return () => {
        active = false;
        subscription.remove();
      };
    },
    onDisconnect: (onError) => {
      const subscription = device.onDisconnected((error) => {
        if (error) {
          logBleFailure("연결 종료", error);
          onError(error);
        } else onError(new Error("참과의 연결이 끊어졌습니다."));
      });
      return () => subscription.remove();
    },
  });
}

export type SmartCharmConnection = {
  ownerId: string;
  device: BleDevice;
  serialNumber: string;
  session: SmartCharmUartSession;
  allowedServiceUuids: string[];
};
let connection: SmartCharmConnection | null = null;
let connecting = false;
let generation = 0;

export async function connectSmartCharm(
  deviceId: string,
  ownerId: string,
  options: { expectedSerial?: string; timeoutMs?: number; allowedServiceUuids?: string[]; notifySettleMs?: number; onStage?: (stage: SmartCharmConnectionStage) => void } = {},
) {
  if (!ownerId) throw new Error("로그인 계정 확인이 필요합니다.");
  if (connecting) throw new Error("다른 참 연결이 진행 중입니다.");
  if (connection?.ownerId === ownerId && connection.device.id === deviceId && !connection.session.isClosed) {
    if (options.expectedSerial && connection.serialNumber !== options.expectedSerial) throw new Error("연결된 참의 ID가 다릅니다.");
    return connection;
  }
  connecting = true;
  let device: BleDevice | undefined;
  let session: SmartCharmUartSession | undefined;
  try {
    await disconnectSmartCharmConnection();
    const attempt = generation;
    const stage = (value: SmartCharmConnectionStage) => {
      if (attempt !== generation) throw new Error("참 연결 작업이 취소되었습니다.");
      options.onStage?.(value);
    };
    const runStage = async <T,>(label: string, uiStage: SmartCharmConnectionStage, action: () => Promise<T>) => {
      stage(uiStage);
      logCharmDebug(`[Charm BLE] ${label} start`);
      try {
        const result = await action();
        logCharmDebug(`[Charm BLE] ${label} success`);
        return result;
      } catch (error) {
        logBleFailure(label, error);
        throw label === "BLE 연결" ? connectionErrorForUser(error) : error;
      }
    };
    device = await runStage("BLE 연결", "BLE 연결 중", () =>
      getSmartCharmBleManager().connectToDevice(deviceId, { timeout: options.timeoutMs ?? 10000 }));
    await runStage("서비스 검색", "서비스 검색 중", () => device!.discoverAllServicesAndCharacteristics());
    const allowedServiceUuids = resolveOrangeScanPolicy(options.allowedServiceUuids);
    session = await runStage("Notify 구독", "Notify 구독 중", async () => {
      const uartSession = await createSmartCharmUartSession(device!, allowedServiceUuids);
      await wait(options.notifySettleMs ?? 150);
      logCharmDebug("[Charm BLE] notify subscription ready");
      return uartSession;
    });
    await runStage("PING 확인", "PING 확인 중", () => session!.ping());
    await runStage("PROFILE 확인", "기기 정보 확인 중", () => session!.verifyProfile());
    const serialNumber = await runStage("DeviceId 확인", "기기 정보 확인 중", () => session!.readDeviceId());
    if (options.expectedSerial && serialNumber !== options.expectedSerial) throw new Error("다른 참에 연결되었습니다. ACK를 보내지 않았습니다.");
    connection = { device, session, serialNumber, ownerId, allowedServiceUuids };
    return connection;
  } catch (error) {
    console.error("[Charm BLE] connection failed:", getBleErrorDetails(error));
    try {
      session?.dispose();
    } catch (cleanupError) {
      console.warn("[Charm BLE] session cleanup failed", getBleErrorDetails(cleanupError));
    }
    try {
      await device?.cancelConnection();
    } catch (cleanupError) {
      console.warn("[Charm BLE] connection cleanup failed", getBleErrorDetails(cleanupError));
    }
    throw error;
  } finally {
    connecting = false;
  }
}

export function getSmartCharmConnection(ownerId: string, serialNumber: string) {
  return connection?.ownerId === ownerId && connection.serialNumber === serialNumber && !connection.session.isClosed ? connection : null;
}

export async function disconnectSmartCharmConnection(bleDeviceId?: string | null) {
  if (bleDeviceId === null || bleDeviceId === "") return;
  generation++;
  const current = connection;
  if (!bleDeviceId || current?.device.id === bleDeviceId) {
    connection = null;
    current?.session.dispose();
  }
  const id = bleDeviceId ?? current?.device.id;
  if (!id || !manager) return;
  try {
    if (await manager.isDeviceConnected(id)) await manager.cancelDeviceConnection(id);
  } catch {
    // Local subscriptions are already released, even when the radio is gone.
  }
}
