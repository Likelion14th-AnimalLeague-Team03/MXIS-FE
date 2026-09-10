import {
  BleManager,
  type Characteristic,
  type Device as BleDevice,
} from "react-native-ble-plx";

export const SMART_CHARM_DEVICE_NAME = "SmartCharm";
export const SMART_CHARM_ORANGE_ID_PREFIX = "SC-OB-";
export const SMART_CHARM_LEGACY_SERVICE_UUID =
  "8A100000-7B2C-4D55-9000-000000000001";
export const SMART_CHARM_NUS_SERVICE_UUID =
  "6E400001-B5A3-F393-E0A9-E50E24DCCA9E";
export const SMART_CHARM_NUS_WRITE_CHARACTERISTIC_UUID =
  "6E400002-B5A3-F393-E0A9-E50E24DCCA9E";
export const SMART_CHARM_NUS_NOTIFY_CHARACTERISTIC_UUID =
  "6E400003-B5A3-F393-E0A9-E50E24DCCA9E";
export const DEFAULT_SMART_CHARM_SERVICE_UUIDS = [
  SMART_CHARM_NUS_SERVICE_UUID,
  SMART_CHARM_LEGACY_SERVICE_UUID,
];

const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const COMMAND_TIMEOUT_MS = 5000;
const SYNC_TIMEOUT_MS = 15000;
const BUSY_RETRY_DELAY_MS = 250;
const MAX_BUSY_RETRIES = 2;
const PRODUCT_NAME_PREFIXES = [
  SMART_CHARM_DEVICE_NAME,
  "MXIS",
  SMART_CHARM_ORANGE_ID_PREFIX,
];
const bleConnectionManager = new BleManager();

export type SensorReadingDto = {
  sequence: number;
  measuredAt: number;
  temperature: number;
  humidity: number;
  maxShock: number;
  motionCount: number;
};

export type SmartCharmUartSession = {
  device: BleDevice;
  writeLine: (command: string, options?: { timeoutMs?: number }) => Promise<string[]>;
  syncReadings: () => Promise<SensorReadingDto[]>;
  dispose: () => void;
};

function wait(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

type UartEndpoint = {
  serviceUUID: string;
  characteristicUUID: string;
  withResponse?: boolean;
};

type LineWaiter = {
  resolve: (lines: string[]) => void;
  reject: (error: Error) => void;
  predicate: (line: string) => boolean;
  collected: string[];
  timer: ReturnType<typeof setTimeout>;
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
  const deviceName = getBleDeviceName(device).trim();
  const advertisedUuids = (device.serviceUUIDs ?? []).map(normalizeUuid);
  const customAllowedServiceUuids = allowedServiceUuids
    .map(normalizeUuid)
    .filter((uuid) => uuid !== normalizeUuid(SMART_CHARM_NUS_SERVICE_UUID));
  const hasProductName = PRODUCT_NAME_PREFIXES.some((prefix) =>
    deviceName.startsWith(prefix),
  );
  const hasLegacyProductService = advertisedUuids.includes(
    normalizeUuid(SMART_CHARM_LEGACY_SERVICE_UUID),
  );
  const hasCustomAllowedService = advertisedUuids.some((uuid) =>
    customAllowedServiceUuids.includes(uuid),
  );

  return hasProductName || hasLegacyProductService || hasCustomAllowedService;
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

function encodeAsciiLine(value: string) {
  return bytesToBase64(
    Uint8Array.from([...value].map((char) => char.charCodeAt(0))),
  );
}

function decodeAsciiString(base64Value: string) {
  const bytes = base64ToBytes(base64Value);

  return String.fromCharCode(...bytes);
}

function isWritable(characteristic: Characteristic) {
  return characteristic.isWritableWithResponse || characteristic.isWritableWithoutResponse;
}

function isNotifiable(characteristic: Characteristic) {
  return characteristic.isNotifiable || characteristic.isIndicatable;
}

function scoreWriteCharacteristic(characteristic: Characteristic) {
  const uuid = normalizeUuid(characteristic.uuid);

  if (uuid === normalizeUuid(SMART_CHARM_NUS_WRITE_CHARACTERISTIC_UUID)) return 100;
  if (characteristic.isWritableWithoutResponse) return 20;
  if (characteristic.isWritableWithResponse) return 10;

  return 0;
}

function scoreNotifyCharacteristic(characteristic: Characteristic) {
  const uuid = normalizeUuid(characteristic.uuid);

  if (uuid === normalizeUuid(SMART_CHARM_NUS_NOTIFY_CHARACTERISTIC_UUID)) return 100;
  if (characteristic.isNotifiable) return 20;
  if (characteristic.isIndicatable) return 10;

  return 0;
}

function selectBestCharacteristic(
  characteristics: Characteristic[],
  predicate: (characteristic: Characteristic) => boolean,
  score: (characteristic: Characteristic) => number,
) {
  return characteristics
    .filter(predicate)
    .sort((first, second) => score(second) - score(first))[0];
}

async function discoverSmartCharmUart(device: BleDevice) {
  const services = await device.services();
  const allCharacteristics: Characteristic[] = [];

  for (const service of services) {
    const characteristics = await device.characteristicsForService(service.uuid);
    allCharacteristics.push(...characteristics);
  }

  const notifyCharacteristic = selectBestCharacteristic(
    allCharacteristics,
    isNotifiable,
    scoreNotifyCharacteristic,
  );
  const writeScope = notifyCharacteristic
    ? allCharacteristics.filter(
        (characteristic) =>
          normalizeUuid(characteristic.serviceUUID) === normalizeUuid(notifyCharacteristic.serviceUUID),
      )
    : allCharacteristics;
  const writeCharacteristic =
    selectBestCharacteristic(writeScope, isWritable, scoreWriteCharacteristic) ??
    selectBestCharacteristic(allCharacteristics, isWritable, scoreWriteCharacteristic);

  if (!writeCharacteristic || !notifyCharacteristic) {
    throw new Error("UART characteristic not found.");
  }

  return {
    write: {
      serviceUUID: writeCharacteristic.serviceUUID,
      characteristicUUID: writeCharacteristic.uuid,
      withResponse: writeCharacteristic.isWritableWithResponse,
    } satisfies UartEndpoint,
    notify: {
      serviceUUID: notifyCharacteristic.serviceUUID,
      characteristicUUID: notifyCharacteristic.uuid,
    } satisfies UartEndpoint,
  };
}

function parseUnsignedInteger(value: string, max: number) {
  if (!/^\d+$/.test(value)) {
    throw new Error("Invalid unsigned integer field.");
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > max) {
    throw new Error("Unsigned integer field out of range.");
  }

  return parsed;
}

function parseSignedInteger(value: string, min: number, max: number) {
  if (!/^-?\d+$/.test(value)) {
    throw new Error("Invalid signed integer field.");
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new Error("Signed integer field out of range.");
  }

  return parsed;
}

export function crc16CcittFalse(bytes: Uint8Array) {
  let crc = 0xffff;

  for (const byte of bytes) {
    crc ^= byte << 8;

    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }

  return crc;
}

function sensorReadingCrcBytes(reading: {
  sequence: number;
  measuredAt: number;
  temperatureX100: number;
  humidityX100: number;
  maxShockX100: number;
  motionCount: number;
}) {
  const bytes = new Uint8Array(16);
  const view = new DataView(bytes.buffer);

  view.setUint32(0, reading.sequence, true);
  view.setUint32(4, reading.measuredAt, true);
  view.setInt16(8, reading.temperatureX100, true);
  view.setUint16(10, reading.humidityX100, true);
  view.setUint16(12, reading.maxShockX100, true);
  view.setUint16(14, reading.motionCount, true);

  return bytes;
}

export function parseSensorReadingLine(line: string): SensorReadingDto {
  const fields = line.split(",");

  if (fields.length !== 8 || fields[0] !== "R") {
    throw new Error("Invalid sensor reading frame.");
  }

  const sequence = parseUnsignedInteger(fields[1], 0xffffffff);
  const measuredAt = parseUnsignedInteger(fields[2], 0xffffffff);
  const temperatureX100 = parseSignedInteger(fields[3], -32768, 32767);
  const humidityX100 = parseUnsignedInteger(fields[4], 0xffff);
  const maxShockX100 = parseUnsignedInteger(fields[5], 0xffff);
  const motionCount = parseUnsignedInteger(fields[6], 0xffff);
  const crcText = fields[7];

  if (!/^[0-9A-F]{4}$/.test(crcText)) {
    throw new Error("Invalid sensor reading CRC format.");
  }

  const expectedCrc = Number.parseInt(crcText, 16);
  const actualCrc = crc16CcittFalse(
    sensorReadingCrcBytes({
      sequence,
      measuredAt,
      temperatureX100,
      humidityX100,
      maxShockX100,
      motionCount,
    }),
  );

  if (actualCrc !== expectedCrc) {
    throw new Error("Sensor reading CRC mismatch.");
  }

  return {
    sequence,
    measuredAt,
    temperature: temperatureX100 / 100,
    humidity: humidityX100 / 100,
    maxShock: maxShockX100 / 100,
    motionCount,
  };
}

function pushReceivedLine(
  line: string,
  pendingLines: string[],
  waiters: LineWaiter[],
) {
  const normalizedLine = line.replace(/\r$/, "").trim();
  if (!normalizedLine) return;

  const waiter = waiters[0];
  if (waiter) {
    waiter.collected.push(normalizedLine);

    if (waiter.predicate(normalizedLine)) {
      clearTimeout(waiter.timer);
      waiters.shift();
      waiter.resolve(waiter.collected);
    }
    return;
  }

  pendingLines.push(normalizedLine);
}

function createLineWaiter(pendingLines: string[], waiters: LineWaiter[]) {
  return function waitForLines(
    predicate: (line: string) => boolean,
    timeoutMs: number,
  ) {
    return new Promise<string[]>((resolve, reject) => {
      const existingIndex = pendingLines.findIndex(predicate);

      if (existingIndex >= 0) {
        resolve(pendingLines.splice(0, existingIndex + 1));
        return;
      }

      const waiter: LineWaiter = {
        resolve,
        reject,
        predicate,
        collected: [],
        timer: setTimeout(() => {
          const waiterIndex = waiters.indexOf(waiter);
          if (waiterIndex >= 0) waiters.splice(waiterIndex, 1);
          reject(new Error("BLE response timed out."));
        }, timeoutMs),
      };

      waiters.push(waiter);
    });
  };
}

export async function createSmartCharmUartSession(
  device: BleDevice,
): Promise<SmartCharmUartSession> {
  const uart = await discoverSmartCharmUart(device);
  const pendingLines: string[] = [];
  const waiters: LineWaiter[] = [];
  let lineBuffer = "";
  const waitForLines = createLineWaiter(pendingLines, waiters);

  const subscription = device.monitorCharacteristicForService(
    uart.notify.serviceUUID,
    uart.notify.characteristicUUID,
    (error, characteristic) => {
      if (error) {
        const waiter = waiters.shift();
        if (waiter) {
          clearTimeout(waiter.timer);
          waiter.reject(new Error(error.message));
        }
        return;
      }

      if (!characteristic?.value) return;

      lineBuffer += decodeAsciiString(characteristic.value);
      const parts = lineBuffer.split("\n");
      lineBuffer = parts.pop() ?? "";
      parts.forEach((part) => pushReceivedLine(part, pendingLines, waiters));
    },
  );

  const writeCommand = async (command: string) => {
    const value = encodeAsciiLine(`${command}\n`);

    if (uart.write.withResponse) {
      await device.writeCharacteristicWithResponseForService(
        uart.write.serviceUUID,
        uart.write.characteristicUUID,
        value,
      );
      return;
    }

    await device.writeCharacteristicWithoutResponseForService(
      uart.write.serviceUUID,
      uart.write.characteristicUUID,
      value,
    );
  };

  const writeLine = async (
    command: string,
    options?: { timeoutMs?: number },
  ) => {
    const commandName = command.split(" ")[0];

    for (let attempt = 0; attempt <= MAX_BUSY_RETRIES; attempt += 1) {
      await writeCommand(command);

      const lines = await waitForLines(
        (line) =>
          line === "PONG" ||
          line.startsWith(commandName + ",") ||
          line.startsWith("ERR,"),
        options?.timeoutMs ?? COMMAND_TIMEOUT_MS,
      );
      const errorLine = lines.find((line) => line.startsWith("ERR,"));

      if (!errorLine) {
        return lines;
      }

      if (errorLine === "ERR,BUSY" && attempt < MAX_BUSY_RETRIES) {
        await wait(BUSY_RETRY_DELAY_MS);
        continue;
      }

      throw new Error(errorLine);
    }

    throw new Error("BLE command failed.");
  };

  return {
    device,
    writeLine,
    syncReadings: async () => {
      await writeLine("PING", { timeoutMs: COMMAND_TIMEOUT_MS });
      await writeLine(`TIME ${Math.floor(Date.now() / 1000)}`, {
        timeoutMs: COMMAND_TIMEOUT_MS,
      });
      await writeLine("STATUS", { timeoutMs: COMMAND_TIMEOUT_MS });
      await writeCommand("SYNC");

      const lines = await waitForLines(
        (line) => line.startsWith("SYNC_END,") || line.startsWith("ERR,"),
        SYNC_TIMEOUT_MS,
      );
      const errorLine = lines.find((line) => line.startsWith("ERR,"));

      if (errorLine) {
        throw new Error(`BLE sync failed: ${errorLine}`);
      }

      const readingMap = new Map<number, SensorReadingDto>();

      lines.forEach((line) => {
        if (!line.startsWith("R,")) return;

        try {
          const reading = parseSensorReadingLine(line);
          readingMap.set(reading.sequence, reading);
        } catch (error) {
          console.warn("[Charm BLE] invalid sensor frame ignored", {
            line,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      });

      return [...readingMap.values()].sort(
        (first, second) => first.sequence - second.sequence,
      );
    },
    dispose: () => {
      subscription.remove();
      waiters.splice(0).forEach((waiter) => {
        clearTimeout(waiter.timer);
        waiter.reject(new Error("BLE connection closed."));
      });
    },
  };
}

export async function readSmartCharmDeviceId(session: SmartCharmUartSession) {
  const lines = await session.writeLine("ID");
  const idLine = lines.find((line) => line.startsWith("ID,"));
  const deviceId = idLine?.slice("ID,".length).trim() ?? "";

  if (!deviceId || !deviceId.startsWith(SMART_CHARM_ORANGE_ID_PREFIX)) {
    throw new Error("Smart Charm Orange ID not found.");
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
    // Ignore disconnect failures so screen/API state changes can continue.
  }
}
