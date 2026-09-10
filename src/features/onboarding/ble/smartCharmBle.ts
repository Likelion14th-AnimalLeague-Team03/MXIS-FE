import { BleManager, type Device as BleDevice } from "react-native-ble-plx";
import {
  DEFAULT_SMART_CHARM_SERVICE_UUIDS, normalizeUuid,
  SMART_CHARM_NUS_SERVICE_UUID, SMART_CHARM_NUS_WRITE_CHARACTERISTIC_UUID,
  SMART_CHARM_NUS_NOTIFY_CHARACTERISTIC_UUID,
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
  return allowed.includes(normalizeUuid(SMART_CHARM_NUS_SERVICE_UUID)) &&
    (device.serviceUUIDs ?? []).some((uuid) => normalizeUuid(uuid) === normalizeUuid(SMART_CHARM_NUS_SERVICE_UUID));
}

export function resolveOrangeScanPolicy(allowed?: string[]) {
  const uuids = allowed ?? DEFAULT_SMART_CHARM_SERVICE_UUIDS;
  if (!Array.isArray(uuids) || !uuids.every((uuid) => typeof uuid === "string") ||
      !uuids.some((uuid) => normalizeUuid(uuid) === normalizeUuid(SMART_CHARM_NUS_SERVICE_UUID))) {
    throw new Error("서버 검색 정책이 Orange BLE UART UUID를 허용하지 않습니다. connection-policy 설정을 확인해 주세요.");
  }
  return [SMART_CHARM_NUS_SERVICE_UUID];
}

export async function createSmartCharmUartSession(device: BleDevice): Promise<SmartCharmUartSession> {
  const services = await device.services();
  const service = services.find((item) => normalizeUuid(item.uuid) === normalizeUuid(SMART_CHARM_NUS_SERVICE_UUID));
  if (!service) throw new Error("Orange UART 서비스를 찾지 못했습니다. 기존 8A1000xx 기기는 이 경로에서 지원하지 않습니다.");
  const characteristics = await device.characteristicsForService(service.uuid);
  const write = characteristics.find((item) => normalizeUuid(item.uuid) === normalizeUuid(SMART_CHARM_NUS_WRITE_CHARACTERISTIC_UUID));
  const notify = characteristics.find((item) => normalizeUuid(item.uuid) === normalizeUuid(SMART_CHARM_NUS_NOTIFY_CHARACTERISTIC_UUID));
  if (!write || !notify || !notify.isNotifiable || (!write.isWritableWithResponse && !write.isWritableWithoutResponse)) {
    throw new Error("UART 쓰기/Notify UUID 또는 속성이 예상과 다릅니다. nRF Connect에서 확인해 주세요.");
  }
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
};
let connection: SmartCharmConnection | null = null;
let connecting = false;
let generation = 0;

export async function connectSmartCharm(
  deviceId: string,
  ownerId: string,
  options: { expectedSerial?: string; timeoutMs?: number; onStage?: (stage: string) => void } = {},
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
    session = await createSmartCharmUartSession(device);
    stage("PING 확인");
    await session.ping();
    stage("PROFILE 확인");
    await session.verifyProfile();
    stage("DeviceId 확인");
    const serialNumber = await session.readDeviceId();
    if (options.expectedSerial && serialNumber !== options.expectedSerial) throw new Error("다른 참에 연결되었습니다. ACK를 보내지 않았습니다.");
    stage("기기 확인 완료");
    connection = { device, session, serialNumber, ownerId };
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
