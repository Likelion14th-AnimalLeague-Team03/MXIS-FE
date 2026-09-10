import { BleManager, type Device as BleDevice } from "react-native-ble-plx";
import {
  DEFAULT_SMART_CHARM_SERVICE_UUIDS, normalizeUuid,
} from "./smartCharmProtocol";
import { createUartSession, type SmartCharmUartSession } from "./smartCharmUartSession";

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
  const matches = services.filter((item) => allowed.has(normalizeUuid(item.uuid)));
  if (matches.length !== 1) throw new Error("센서 통신 경로를 하나로 확인할 수 없습니다. Bluetooth 설정을 확인해 주세요.");
  const service = matches[0];
  const characteristics = await device.characteristicsForService(service.uuid);
  const writes = characteristics.filter((item) => item.isWritableWithResponse || item.isWritableWithoutResponse);
  const notifications = characteristics.filter((item) => item.isNotifiable);
  if (writes.length !== 1 || notifications.length !== 1) {
    throw new Error("센서의 쓰기·수신 경로를 확인할 수 없습니다. Bluetooth 속성을 확인해 주세요.");
  }
  const write = writes[0];
  const notify = notifications[0];
  return createUartSession({
    write: (value) => write.isWritableWithResponse
      ? device.writeCharacteristicWithResponseForService(service.uuid, write.uuid, value)
      : device.writeCharacteristicWithoutResponseForService(service.uuid, write.uuid, value),
    subscribe: (onValue, onError) => {
      const subscription = device.monitorCharacteristicForService(service.uuid, notify.uuid, (error, item) => {
        if (error) onError(new Error(error.message));
        else if (item?.value != null) onValue(item.value);
      });
      return () => subscription.remove();
    },
    onDisconnect: (onError) => {
      const subscription = device.onDisconnected((error) => onError(new Error(error?.message ?? "참과의 연결이 끊어졌습니다.")));
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
  options: { expectedSerial?: string; timeoutMs?: number; allowedServiceUuids?: string[]; onStage?: (stage: string) => void } = {},
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
    const stage = (value: string) => {
      if (attempt !== generation) throw new Error("참 연결 작업이 취소되었습니다.");
      options.onStage?.(value);
    };
    stage("BLE 연결");
    device = await getSmartCharmBleManager().connectToDevice(deviceId, { timeout: options.timeoutMs ?? 10000 });
    stage("서비스 검색");
    await device.discoverAllServicesAndCharacteristics();
    stage("UART 구독");
    const allowedServiceUuids = resolveOrangeScanPolicy(options.allowedServiceUuids);
    session = await createSmartCharmUartSession(device, allowedServiceUuids);
    stage("PING 확인");
    await session.ping();
    stage("PROFILE 확인");
    await session.verifyProfile();
    stage("DeviceId 확인");
    const serialNumber = await session.readDeviceId();
    if (options.expectedSerial && serialNumber !== options.expectedSerial) throw new Error("다른 참에 연결되었습니다. ACK를 보내지 않았습니다.");
    stage("기기 확인 완료");
    connection = { device, session, serialNumber, ownerId, allowedServiceUuids };
    return connection;
  } catch (error) {
    session?.dispose();
    await device?.cancelConnection().catch(() => undefined);
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
