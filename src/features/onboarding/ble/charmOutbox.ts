import { sameReading, validateReading, type CharmSyncResult, type SensorReadingDto } from "./smartCharmProtocol";

type Storage = { getItem: (key: string) => Promise<string | null>; setItem: (key: string, value: string) => Promise<void> };
export type CharmOutboxState = {
  version: 1;
  serialNumber: string;
  bleDeviceId: string;
  backendDeviceId: number | null;
  acknowledgedThrough: number | null;
  pendingAck: number | null;
  latest: number;
  dropped: number;
  conflict: boolean;
  readings: SensorReadingDto[];
};
const uint32 = (value: unknown): value is number => Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 0xffffffff;

export class CharmOutbox {
  private tail: Promise<unknown> = Promise.resolve();
  constructor(private storage: Storage) {}

  private key(owner: string, serial: string) {
    if (!owner || !/^SC-OB-[0-9]{6}$/.test(serial)) throw new Error("전송 대기열의 계정 또는 기기 ID가 잘못되었습니다.");
    return `mxis.charm.uart.v1.${encodeURIComponent(owner)}.${encodeURIComponent(serial)}`;
  }

  private async load(key: string, serial: string): Promise<CharmOutboxState | null> {
    const value = await this.storage.getItem(key);
    if (!value) return null;
    const box = JSON.parse(value) as CharmOutboxState;
    if (!box || box.version !== 1 || box.serialNumber !== serial || typeof box.bleDeviceId !== "string" ||
        (box.backendDeviceId !== null && (!Number.isSafeInteger(box.backendDeviceId) || box.backendDeviceId <= 0)) ||
        (box.acknowledgedThrough !== null && !uint32(box.acknowledgedThrough)) ||
        (box.pendingAck !== null && (!uint32(box.pendingAck) || box.acknowledgedThrough === null || box.pendingAck <= box.acknowledgedThrough || box.pendingAck > box.latest)) ||
        !uint32(box.latest) || !uint32(box.dropped) || typeof box.conflict !== "boolean" || !Array.isArray(box.readings) || box.readings.length > 10000) {
      throw new Error("저장된 전송 대기열이 손상되었습니다. 자동 삭제하지 않았습니다.");
    }
    const seen = new Set<number>();
    for (const reading of box.readings) {
      validateReading(reading);
      if (seen.has(reading.sequence)) throw new Error("저장된 sequence가 중복되었습니다.");
      seen.add(reading.sequence);
    }
    return box;
  }

  private transaction<T>(action: () => Promise<T>): Promise<T> {
    const result = this.tail.then(action);
    this.tail = result.catch(() => undefined);
    return result;
  }

  read(owner: string, serial: string) {
    return this.transaction(() => this.load(this.key(owner, serial), serial));
  }

  private update(owner: string, serial: string, mutate: (box: CharmOutboxState) => void) {
    return this.transaction(async () => {
      const key = this.key(owner, serial);
      const box = await this.load(key, serial) ?? {
        version: 1, serialNumber: serial, bleDeviceId: "", backendDeviceId: null,
        acknowledgedThrough: null, pendingAck: null, latest: 0, dropped: 0,
        conflict: false, readings: [],
      } satisfies CharmOutboxState;
      mutate(box);
      await this.storage.setItem(key, JSON.stringify(box));
      if (box.conflict) throw new Error("같은 기기 ID와 번호의 센서값이 충돌합니다. ACK를 중단했습니다.");
      return box;
    });
  }

  remember(owner: string, serial: string, bleDeviceId: string) {
    return this.update(owner, serial, (box) => { box.bleDeviceId = bleDeviceId; });
  }

  private merge(box: CharmOutboxState, readings: SensorReadingDto[]) {
    const map = new Map(box.readings.map((reading) => [reading.sequence, reading]));
    for (const reading of readings) {
      validateReading(reading);
      const old = map.get(reading.sequence);
      if (old && !sameReading(old, reading)) box.conflict = true;
      else if (box.acknowledgedThrough === null || reading.sequence > box.acknowledgedThrough) map.set(reading.sequence, reading);
    }
    if (map.size > 10000) throw new Error("전송 대기열이 가득 찼습니다. 데이터는 자동 삭제하지 않습니다.");
    box.readings = [...map.values()].sort((a, b) => a.sequence - b.sequence);
  }

  saveReadings(owner: string, serial: string, readings: SensorReadingDto[]) {
    return this.update(owner, serial, (box) => this.merge(box, readings));
  }

  saveSync(owner: string, serial: string, sync: CharmSyncResult) {
    return this.update(owner, serial, (box) => {
      if (sync.after.latest < box.latest) throw new Error("기기 sequence가 과거로 돌아갔습니다. 저장 초기화 여부를 확인해 주세요.");
      if (box.acknowledgedThrough === null) box.acknowledgedThrough = sync.before.lastAck;
      if (sync.after.lastAck !== box.acknowledgedThrough && sync.after.lastAck !== box.pendingAck) {
        throw new Error("기기의 ACK가 앱의 저장 근거와 다릅니다. 다른 연결의 삭제 여부를 확인해 주세요.");
      }
      box.latest = sync.after.latest;
      box.dropped = sync.after.dropped;
      this.merge(box, sync.readings);
    });
  }

  bindBackend(owner: string, serial: string, backendDeviceId: number) {
    return this.update(owner, serial, (box) => {
      if (!Number.isSafeInteger(backendDeviceId) || backendDeviceId <= 0 ||
          (box.backendDeviceId !== null && box.backendDeviceId !== backendDeviceId)) {
        throw new Error("서버 기기 ID가 기존 등록과 일치하지 않습니다.");
      }
      box.backendDeviceId = backendDeviceId;
    });
  }

  recordServerAck(owner: string, serial: string, ack: number | null | undefined, uploaded: SensorReadingDto[]) {
    return this.update(owner, serial, (box) => {
      if (box.conflict || box.acknowledgedThrough === null || box.backendDeviceId === null) throw new Error("ACK 저장 근거가 준비되지 않았습니다.");
      if (ack == null) return;
      const maxUploaded = uploaded.reduce((max, r) => Math.max(max, r.sequence), 0);
      if (!uint32(ack) || ack > box.latest || ack > maxUploaded) throw new Error("서버 ACK가 업로드/기기 범위를 벗어났습니다. ACK를 보내지 않았습니다.");
      if (ack <= box.acknowledgedThrough) return;
      const eligible = new Map(uploaded.filter((r) => r.measuredAt > 0).map((r) => [r.sequence, r]));
      const saved = new Map(box.readings.map((r) => [r.sequence, r]));
      for (let sequence = box.acknowledgedThrough + 1; sequence <= ack; sequence++) {
        const reading = eligible.get(sequence);
        const original = saved.get(sequence);
        // A missing or unsynced record blocks a cumulative ACK, even after HTTP success.
        if (!reading || !original || !sameReading(reading, original)) return;
      }
      box.pendingAck = ack;
    });
  }

  confirmAck(owner: string, serial: string, ack: number, deviceLastAck: number) {
    return this.update(owner, serial, (box) => {
      if (box.conflict || box.pendingAck !== ack || deviceLastAck !== ack) throw new Error("ACK 저장 확인이 일치하지 않습니다.");
      box.acknowledgedThrough = ack;
      box.pendingAck = null;
      box.readings = box.readings.filter((r) => r.sequence > ack);
    });
  }
}
