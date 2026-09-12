export const SMART_CHARM_DEVICE_NAME = "SmartCharm";
export const SMART_CHARM_ORANGE_ID_PREFIX = "SC-OB-";
export const SMART_CHARM_NUS_SERVICE_UUID = "6E400001-B5A3-F393-E0A9-E50E24DCCA9E";
export const SMART_CHARM_NUS_WRITE_CHARACTERISTIC_UUID = "6E400002-B5A3-F393-E0A9-E50E24DCCA9E";
export const SMART_CHARM_NUS_NOTIFY_CHARACTERISTIC_UUID = "6E400003-B5A3-F393-E0A9-E50E24DCCA9E";
export const DEFAULT_SMART_CHARM_SERVICE_UUIDS = [SMART_CHARM_NUS_SERVICE_UUID];
export const SMART_CHARM_PROFILE = "PROFILE,SMARTCHARM_UART,1,LEGACY_GATT=0";

export type SensorReadingDto = {
  sequence: number;
  measuredAt: number;
  temperature: number;
  humidity: number;
  maxShock: number;
  motionCount: number;
  raw?: { temperatureX100: number; humidityX100: number; maxShockX100: number };
};

export type CharmStatus = {
  pending: number;
  latest: number;
  lastAck: number;
  dropped: number;
  time: number;
  storageState: number;
};

export type CharmSyncResult = {
  readings: SensorReadingDto[];
  through: number;
  before: CharmStatus;
  after: CharmStatus;
};

const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
export const normalizeUuid = (uuid: string) => uuid.toLowerCase();

export function bytesToBase64(bytes: Uint8Array) {
  let output = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const bits = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    output += BASE64[(bits >> 18) & 63] + BASE64[(bits >> 12) & 63];
    output += i + 1 < bytes.length ? BASE64[(bits >> 6) & 63] : "=";
    output += i + 2 < bytes.length ? BASE64[bits & 63] : "=";
  }
  return output;
}

export function base64ToBytes(value: string) {
  if (value.length > 8192 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new Error("BLE Base64 데이터가 손상되었습니다.");
  }
  const bytes: number[] = [];
  let bits = 0;
  let count = 0;
  for (const char of value.replace(/=+$/, "")) {
    bits = (bits << 6) | BASE64.indexOf(char);
    count += 6;
    if (count >= 8) {
      count -= 8;
      bytes.push((bits >> count) & 255);
      bits &= (1 << count) - 1;
    }
  }
  const result = new Uint8Array(bytes);
  if (bytesToBase64(result) !== value) throw new Error("잘못된 Base64 패딩입니다.");
  return result;
}

export function encodeCommand(command: string) {
  if (!/^(?:[A-Z]+(?: [0-9]+)?|LIVE (?:ON|OFF))$/.test(command) || command.length > 31) {
    throw new Error("잘못된 UART 명령입니다.");
  }
  const bytes = Uint8Array.from(command + "\n", (char) => char.charCodeAt(0));
  return bytesToBase64(bytes);
}

// Notifications are a byte stream; neither callback nor MTU boundaries are frames.
export class UartLineDecoder {
  private pending = "";

  push(bytes: Uint8Array): string[] {
    const lines: string[] = [];
    for (const byte of bytes) {
      if (byte === 10) {
        const line = this.pending.replace(/\r$/, "");
        this.pending = "";
        if (line && !/^[\x20-\x7e]+$/.test(line)) throw new Error("UART 줄이 손상되었습니다.");
        if (line) lines.push(line);
      } else {
        if ((byte !== 13 && (byte < 32 || byte > 126)) || this.pending.length >= 94) {
          this.pending = "";
          throw new Error("UART 프레임 크기 또는 인코딩 오류입니다.");
        }
        this.pending += String.fromCharCode(byte);
      }
    }
    return lines;
  }
}

export function parseInteger(value: string, min = 0, max = 0xffffffff) {
  if (!(min < 0 ? /^-?\d+$/ : /^\d+$/).test(value)) throw new Error("정수 필드가 손상되었습니다.");
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) throw new Error("정수 범위를 벗어났습니다.");
  return number;
}

export function crc16CcittFalse(bytes: Uint8Array) {
  let crc = 0xffff;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = ((crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff;
    }
  }
  return crc;
}

export function parseSensorReadingLine(line: string): SensorReadingDto {
  const f = line.split(",");
  if (line.length > 93 || f.length !== 8 || f[0] !== "R" || !/^[0-9A-F]{4}$/.test(f[7])) {
    throw new Error("센서 프레임 형식 오류입니다.");
  }
  const sequence = parseInteger(f[1], 1);
  const measuredAt = parseInteger(f[2]);
  const temperature = parseInteger(f[3], -32768, 32767);
  const humidity = parseInteger(f[4], 0, 65535);
  const shock = parseInteger(f[5], 0, 65535);
  const motionCount = parseInteger(f[6], 0, 65535);
  const bytes = new Uint8Array(16);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, sequence, true);
  view.setUint32(4, measuredAt, true);
  view.setInt16(8, temperature, true);
  view.setUint16(10, humidity, true);
  view.setUint16(12, shock, true);
  view.setUint16(14, motionCount, true);
  if (crc16CcittFalse(bytes) !== Number(`0x${f[7]}`)) throw new Error("센서 CRC 검증에 실패했습니다.");
  return { sequence, measuredAt, temperature: temperature / 100, humidity: humidity / 100, maxShock: shock / 100, motionCount,
    raw: { temperatureX100: temperature, humidityX100: humidity, maxShockX100: shock } };
}

export function sameReading(a: SensorReadingDto, b: SensorReadingDto) {
  const aRaw = a.raw ?? {
    temperatureX100: Math.round(a.temperature * 100),
    humidityX100: Math.round(a.humidity * 100),
    maxShockX100: Math.round(a.maxShock * 100),
  };
  const bRaw = b.raw ?? {
    temperatureX100: Math.round(b.temperature * 100),
    humidityX100: Math.round(b.humidity * 100),
    maxShockX100: Math.round(b.maxShock * 100),
  };
  const sameRaw =
    aRaw.temperatureX100 === bRaw.temperatureX100 &&
    aRaw.humidityX100 === bRaw.humidityX100 &&
    aRaw.maxShockX100 === bRaw.maxShockX100;

  return sameRaw && a.sequence === b.sequence && a.measuredAt === b.measuredAt &&
    a.temperature === b.temperature && a.humidity === b.humidity &&
    a.maxShock === b.maxShock && a.motionCount === b.motionCount;
}

export function validateReading(r: SensorReadingDto) {
  if (!r || !Number.isInteger(r.sequence) || r.sequence < 1 || r.sequence > 0xffffffff ||
      !Number.isInteger(r.measuredAt) || r.measuredAt < 0 || r.measuredAt > 0xffffffff ||
      !Number.isInteger(r.motionCount) || r.motionCount < 0 || r.motionCount > 65535 ||
      !Number.isFinite(r.temperature) || r.temperature < -327.68 || r.temperature > 327.67 ||
      !Number.isFinite(r.humidity) || r.humidity < 0 || r.humidity > 655.35 ||
      !Number.isFinite(r.maxShock) || r.maxShock < 0 || r.maxShock > 655.35) {
    throw new Error("저장된 센서값이 손상되었습니다.");
  }
  if (r.raw && (
    !Number.isInteger(r.raw.temperatureX100) || r.raw.temperatureX100 / 100 !== r.temperature ||
    !Number.isInteger(r.raw.humidityX100) || r.raw.humidityX100 / 100 !== r.humidity ||
    !Number.isInteger(r.raw.maxShockX100) || r.raw.maxShockX100 / 100 !== r.maxShock
  )) throw new Error("센서 원본값과 표시값이 일치하지 않습니다.");
}

export function parseDiagnostics(line: string) {
  const fields = line.split(",");
  if (fields.length !== 5 || fields[0] !== "DIAG") throw new Error("센서 진단 응답을 확인할 수 없습니다.");
  const [bleRxBytes, commandErrors, sensorErrors, missedImuSamples] = fields.slice(1).map((value) => parseInteger(value));
  return { bleRxBytes, commandErrors, sensorErrors, missedImuSamples };
}

export function parseStatus(line: string): CharmStatus {
  const f = line.split(",");
  if (f.length !== 7 || f[0] !== "STATUS") throw new Error("STATUS 응답 형식 오류입니다.");
  const status = {
    pending: parseInteger(f[1], 0, 20), latest: parseInteger(f[2]),
    lastAck: parseInteger(f[3]), dropped: parseInteger(f[4]),
    time: parseInteger(f[5]), storageState: parseInteger(f[6], 0, 2),
  };
  if (status.storageState === 0 && (status.lastAck > status.latest || status.pending > status.latest - status.lastAck)) {
    throw new Error("기기 저장 상태가 일치하지 않습니다.");
  }
  return status;
}

export class SyncCollector {
  private begin: { count: number; through: number } | null = null;
  private readings = new Map<number, SensorReadingDto>();
  result: { readings: SensorReadingDto[]; through: number } | null = null;

  push(line: string) {
    if (this.result) throw new Error("완료된 SYNC에 응답이 추가되었습니다.");
    const f = line.split(",");
    if (f[0] === "SYNC_BEGIN") {
      if (this.begin || f.length !== 3) throw new Error("중복 또는 잘못된 SYNC 시작입니다.");
      this.begin = { count: parseInteger(f[1], 0, 20), through: parseInteger(f[2]) };
      if (this.begin.through < this.begin.count) throw new Error("SYNC 범위 오류입니다.");
    } else if (f[0] === "R") {
      const r = parseSensorReadingLine(line);
      if (!this.begin) return false;
      const { count, through } = this.begin;
      if (!count || r.sequence < through - count + 1 || r.sequence > through) throw new Error("SYNC 범위를 벗어난 기록입니다.");
      const old = this.readings.get(r.sequence);
      if (old && !sameReading(old, r)) throw new Error("동일 번호의 센서값이 충돌합니다.");
      if (!old && r.sequence !== through - count + 1 + this.readings.size) throw new Error("SYNC 번호 누락 또는 순서 오류입니다.");
      this.readings.set(r.sequence, r);
      return !old;
    } else if (f[0] === "SYNC_END") {
      if (!this.begin || f.length !== 4) throw new Error("SYNC 시작 없이 종료되었거나 형식이 잘못되었습니다.");
      const sent = parseInteger(f[1], 0, 20);
      const through = parseInteger(f[2]);
      parseInteger(f[3], 0, 20);
      if (through !== this.begin.through || sent !== this.begin.count || sent !== this.readings.size) {
        throw new Error("전체 센서 데이터가 수신되지 않았습니다. 다시 동기화해 주세요.");
      }
      this.result = { readings: [...this.readings.values()], through };
    } else return false;
    return true;
  }
}
