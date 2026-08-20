import { BleManager, type Device as BleDevice } from "react-native-ble-plx";

export const SMART_CHARM_DEVICE_NAME = "SmartCharm";
export const SMART_CHARM_SERVICE_UUID =
  "8A100000-7B2C-4D55-9000-000000000001";
export const SENSOR_READING_CHARACTERISTIC_UUID =
  "8A100001-7B2C-4D55-9000-000000000001";
export const PENDING_COUNT_CHARACTERISTIC_UUID =
  "8A100002-7B2C-4D55-9000-000000000001";
export const ACK_CHARACTERISTIC_UUID = "8A100003-7B2C-4D55-9000-000000000001";
export const TIME_SYNC_CHARACTERISTIC_UUID =
  "8A100004-7B2C-4D55-9000-000000000001";
export const DROPPED_READING_COUNT_CHARACTERISTIC_UUID =
  "8A100008-7B2C-4D55-9000-000000000001";
export const DEVICE_ID_CHARACTERISTIC_UUID =
  "8A100009-7B2C-4D55-9000-000000000001";

const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const bleConnectionManager = new BleManager();

export type SensorReadingDto = {
  sequence: number;
  measuredAt: number;
  temperature: number;
  humidity: number;
  maxShock: number;
  motionCount: number;
};

export function normalizeUuid(uuid: string) {
  return uuid.toLowerCase();
}

export function getBleDeviceName(device: BleDevice) {
  const localName = (device as BleDevice & { localName?: string | null }).localName;

  return localName || device.name || SMART_CHARM_DEVICE_NAME;
}

export function getBleFallbackSerialNumber(device: BleDevice) {
  const name = getBleDeviceName(device);

  if (name !== SMART_CHARM_DEVICE_NAME) {
    return name;
  }

  return device.id;
}

export function isSmartCharmDevice(
  device: BleDevice,
  allowedServiceUuids: string[],
) {
  const deviceName = getBleDeviceName(device);
  const advertisedUuids = (device.serviceUUIDs ?? []).map(normalizeUuid);
  const allowedUuids = allowedServiceUuids.map(normalizeUuid);
  const hasAllowedService = advertisedUuids.some((uuid) =>
    allowedUuids.includes(uuid),
  );

  return deviceName.includes(SMART_CHARM_DEVICE_NAME) || hasAllowedService;
}

export function bytesToBase64(bytes: Uint8Array) {
  let output = "";
  let index = 0;

  while (index < bytes.length) {
    const first = bytes[index++];
    const second = index < bytes.length ? bytes[index++] : undefined;
    const third = index < bytes.length ? bytes[index++] : undefined;
    const triple =
      (first << 16) | ((second ?? 0) << 8) | ((third ?? 0) << 0);

    output += BASE64_CHARS[(triple >> 18) & 63];
    output += BASE64_CHARS[(triple >> 12) & 63];
    output += second === undefined ? "=" : BASE64_CHARS[(triple >> 6) & 63];
    output += third === undefined ? "=" : BASE64_CHARS[triple & 63];
  }

  return output;
}

export function base64ToBytes(base64: string) {
  const cleanBase64 = base64.replace(/=+$/, "");
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const char of cleanBase64) {
    const value = BASE64_CHARS.indexOf(char);

    if (value < 0) continue;

    buffer = (buffer << 6) | value;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }

  return new Uint8Array(bytes);
}

export function uint32LittleEndian(value: number) {
  const bytes = new Uint8Array(4);
  const view = new DataView(bytes.buffer);

  view.setUint32(0, value, true);

  return bytes;
}

export function decodeSensorReading(base64Value: string): SensorReadingDto {
  const bytes = base64ToBytes(base64Value);

  if (bytes.byteLength !== 16) {
    throw new Error("SensorReading payload는 16 bytes여야 합니다.");
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const sequence = view.getUint32(0, true);
  const measuredAt = view.getUint32(4, true);
  const temperatureX100 = view.getInt16(8, true);
  const humidityX100 = view.getUint16(10, true);
  const maxShockX100 = view.getUint16(12, true);
  const motionCount = view.getUint16(14, true);

  return {
    sequence,
    measuredAt,
    temperature: temperatureX100 / 100,
    humidity: humidityX100 / 100,
    maxShock: maxShockX100 / 100,
    motionCount,
  };
}

export function decodeUint32LittleEndian(base64Value: string) {
  const bytes = base64ToBytes(base64Value);

  if (bytes.byteLength !== 4) {
    throw new Error("uint32 payload는 4 bytes여야 합니다.");
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  return view.getUint32(0, true);
}

export function decodeUint16LittleEndian(base64Value: string) {
  const bytes = base64ToBytes(base64Value);

  if (bytes.byteLength !== 2) {
    throw new Error("uint16 payload must be 2 bytes.");
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  return view.getUint16(0, true);
}

export function decodeUtf8String(base64Value: string) {
  const bytes = base64ToBytes(base64Value);

  return String.fromCharCode(...bytes).replace(/\0+$/, "");
}

export async function readSmartCharmDeviceId(device: BleDevice) {
  const characteristic = await device.readCharacteristicForService(
    SMART_CHARM_SERVICE_UUID,
    DEVICE_ID_CHARACTERISTIC_UUID,
  );
  const deviceId = characteristic.value
    ? decodeUtf8String(characteristic.value)
    : "";

  if (!deviceId || !deviceId.startsWith("SC-")) {
    throw new Error("Smart Charm 고유 ID를 확인할 수 없습니다.");
  }

  return deviceId;
}

export async function disconnectSmartCharmConnection(
  bleDeviceId?: string | null,
) {
  if (!bleDeviceId) return;

  try {
    const isConnected =
      await bleConnectionManager.isDeviceConnected(bleDeviceId);

    if (!isConnected) return;

    await bleConnectionManager.cancelDeviceConnection(bleDeviceId);
  } catch {
    // 화면/API 상태 변경을 막지 않기 위해 BLE 해제 실패는 조용히 넘깁니다.
  }
}

export async function writeTimeSync(device: BleDevice) {
  const unixSeconds = Math.floor(Date.now() / 1000);

  await device.writeCharacteristicWithResponseForService(
    SMART_CHARM_SERVICE_UUID,
    TIME_SYNC_CHARACTERISTIC_UUID,
    bytesToBase64(uint32LittleEndian(unixSeconds)),
  );
}

export async function writeAckSequence(device: BleDevice, sequence: number) {
  await device.writeCharacteristicWithResponseForService(
    SMART_CHARM_SERVICE_UUID,
    ACK_CHARACTERISTIC_UUID,
    bytesToBase64(uint32LittleEndian(sequence)),
  );
}
