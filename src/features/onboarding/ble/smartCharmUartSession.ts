import {
  base64ToBytes, encodeCommand, parseInteger, parseSensorReadingLine, parseStatus, parseDiagnostics,
  SMART_CHARM_PROFILE, SyncCollector, UartLineDecoder,
  type CharmStatus, type CharmSyncResult, type SensorReadingDto,
} from "./smartCharmProtocol";

export type UartTransport = {
  write: (value: string) => Promise<unknown>;
  subscribe: (onValue: (value: string) => void, onError: (error: Error) => void) => () => void;
  onDisconnect: (onError: (error: Error) => void) => () => void;
};

export type SmartCharmUartSession = ReturnType<typeof createUartSession>;
type PendingRequest = {
  accept: (line: string) => boolean;
  resolve: (line: string) => void;
  reject: (error: Error) => void;
};

export function createUartSession(
  transport: UartTransport,
  timings = { command: 3000, sync: 15000, progress: 3000, busy: 300 },
) {
  const decoder = new UartLineDecoder();
  let closed: Error | null = null;
  let pending: PendingRequest | null = null;
  let cancelRequest: ((error: Error) => void) | undefined;
  let tail: Promise<unknown> = Promise.resolve();
  let removeNotify = () => {};
  let removeDisconnect = () => {};
  let readingHandler: ((reading: SensorReadingDto) => void) | undefined;
  let queued = 0;

  function dispose(error = new Error("BLE 연결이 종료되었습니다. 다시 연결해 주세요.")) {
    if (closed) return;
    closed = error;
    cancelRequest?.(error);
    pending?.reject(error);
    pending = null;
    readingHandler = undefined;
    try {
      removeNotify();
    } catch (cleanupError) {
      console.warn("[Charm BLE] notify cleanup failed", cleanupError);
    }
    try {
      removeDisconnect();
    } catch (cleanupError) {
      console.warn("[Charm BLE] disconnect listener cleanup failed", cleanupError);
    }
  }

  const enqueue = <T,>(task: () => Promise<T>): Promise<T> => {
    queued++;
    const next = tail.then(() => {
      if (closed) throw closed;
      return task();
    }).finally(() => { queued--; });
    tail = next.catch(() => undefined);
    return next;
  };

  function receive(value: string) {
    if (closed) return;
    try {
      console.log("[Charm BLE] notification raw base64:", value);
      for (const line of decoder.push(base64ToBytes(value))) {
        console.log("[Charm BLE] notification decoded:", line);
        if (line.startsWith("R,")) readingHandler?.(parseSensorReadingLine(line));
        // A response is routed only to the one command currently on the wire.
        const active = pending;
        if (active && active.accept(line)) {
          pending = null;
          active.resolve(line);
        }
      }
    } catch (error) {
      dispose(error instanceof Error ? error : new Error(String(error)));
    }
  }
  removeNotify = transport.subscribe(receive, dispose);
  if (!closed) {
    removeDisconnect = transport.onDisconnect(dispose);
    if (closed) removeDisconnect();
  }
  else removeNotify();

  async function request(
    command: string,
    accept: (line: string) => boolean,
    timeoutMs = timings.command,
    progressTimeout?: number,
    isProgress?: () => boolean,
  ) {
    if (closed) throw closed;
    const encoded = encodeCommand(command);
    let timer: ReturnType<typeof setTimeout>;
    let progress: ReturnType<typeof setTimeout> | undefined;
    const cancelled = new Promise<never>((_, reject) => { cancelRequest = reject; });
    const response = new Promise<string>((resolve, reject) => {
      const timeout = () => dispose(new Error(`${command.split(" ")[0]} 응답 시간 초과입니다. 재연결이 필요합니다.`));
      timer = setTimeout(timeout, timeoutMs);
      const resetProgress = () => {
        if (!progressTimeout) return;
        clearTimeout(progress);
        progress = setTimeout(timeout, progressTimeout);
      };
      resetProgress();
      pending = {
        resolve, reject,
        accept: (line) => {
          if (line.startsWith("ERR,")) return true;
          const done = accept(line);
          if (progressTimeout && isProgress?.()) resetProgress();
          return done;
        },
      };
    });
    try {
      // Register before writing: some devices notify before the GATT write resolves.
      console.log(`[Charm BLE] write ${command}`);
      const [line] = await Promise.race([
        Promise.all([response, Promise.resolve().then(() => transport.write(encoded))]),
        cancelled,
      ]);
      return line;
    } catch (error) {
      dispose(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      clearTimeout(timer!);
      clearTimeout(progress);
      pending = null;
      cancelRequest = undefined;
    }
  }

  async function command(value: string, accept: (line: string) => boolean, timeoutMs = timings.command, allowUnsupported = false) {
    for (let attempt = 0; attempt < 4; attempt++) {
      const line = await request(value, accept, timeoutMs);
      if ((line === "ERR,BUSY" || line === "ERR,INVALID_FRAME") && attempt < 3) {
        if (line === "ERR,INVALID_FRAME") {
          console.warn(`[Charm BLE] ${value} frame collision; retrying`, {
            attempt: attempt + 1,
          });
        }
        await new Promise((resolve) => setTimeout(resolve, timings.busy * [1, 2, 10 / 3][attempt]));
        continue;
      }
      if (allowUnsupported && line === "ERR,COMMAND") return line;
      if (line.startsWith("ERR,")) throw new Error(`기기 명령 오류: ${line}`);
      return line;
    }
    throw new Error("기기 저장이 끝나지 않았습니다.");
  }

  async function status(): Promise<CharmStatus> {
    for (let attempt = 0; attempt < 4; attempt++) {
      const result = parseStatus(await command("STATUS", (line) => line.startsWith("STATUS,")));
      if (result.storageState === 2) throw new Error("기기 EEPROM 저장 오류입니다.");
      if (result.storageState === 0) return result;
      await new Promise((resolve) => setTimeout(resolve, timings.busy * (attempt + 1)));
    }
    throw new Error("기기가 아직 저장 중입니다. 잠시 후 다시 시도해 주세요.");
  }

  return {
    get isClosed() { return closed !== null; },
    get isBusy() { return queued > 0; },
    setReadingHandler(handler?: (reading: SensorReadingDto) => void) { readingHandler = handler; },
    dispose,
    ping: () => enqueue(() => command("PING", (line) => line === "PONG")),
    verifyProfile: () => enqueue(async () => {
      // UART v1 without the optional PROFILE command still identifies itself through ID/STATUS.
      const line = await command("PROFILE", (value) => value.startsWith("PROFILE,"), timings.command, true);
      if (line === "ERR,COMMAND") return;
      if (line !== SMART_CHARM_PROFILE) throw new Error("지원하지 않는 참 펌웨어입니다. Orange UART v1이 필요합니다.");
      console.log("[Charm BLE] PROFILE verified");
    }),
    readDeviceId: () => enqueue(async () => {
      const line = await command("ID", (value) => value.startsWith("ID,"));
      if (!/^ID,SC-OB-[0-9]{6}$/.test(line)) throw new Error("참의 고유 ID 형식을 확인할 수 없습니다.");
      const serialNumber = line.slice(3);
      console.log("[Charm BLE] DeviceId verified", serialNumber);
      return serialNumber;
    }),
    setTime: (seconds: number) => enqueue(async () => {
      parseInteger(String(seconds), 1);
      const line = await command(`TIME ${seconds}`, (value) => value.startsWith("TIME,"));
      if (line !== `TIME,ACCEPTED,${seconds}`) throw new Error("TIME 응답값이 요청과 다릅니다.");
    }),
    getStatus: () => enqueue(status),
    getDiagnostics: () => enqueue(async () => parseDiagnostics(await command("DIAG", (line) => line.startsWith("DIAG,")))),
    getBattery: () => enqueue(async () => {
      const line = await command("BATTERY", (value) => value.startsWith("BATTERY,"));
      if (line !== "BATTERY,UNAVAILABLE") throw new Error("배터리 응답을 확인할 수 없습니다.");
      return null;
    }),
    stop: () => enqueue(() => command("STOP", (line) => line === "SYNC_STOPPED")),
    setLive: (enabled: boolean) => enqueue(async () => {
      const command = `LIVE ${enabled ? "ON" : "OFF"}`;
      console.log(`[Charm BLE] write ${command}`);
      await transport.write(encodeCommand(command));
    }),
    syncReadings: (): Promise<CharmSyncResult> => enqueue(async () => {
      const before = await status();
      let result: SyncCollector["result"] = null;
      for (let attempt = 0; attempt < 4; attempt++) {
        const collector = new SyncCollector();
        let progressed = false;
        const line = await request("SYNC", (value) => {
          progressed = collector.push(value);
          return collector.result !== null;
        }, timings.sync, timings.progress, () => progressed);
        if ((line === "ERR,BUSY" || line === "ERR,INVALID_FRAME") && attempt < 3) {
          if (line === "ERR,INVALID_FRAME") {
            console.warn("[Charm BLE] SYNC frame collision; retrying", {
              attempt: attempt + 1,
            });
          }
          await new Promise((resolve) => setTimeout(resolve, timings.busy * [1, 2, 10 / 3][attempt]));
          continue;
        }
        if (line.startsWith("ERR,")) throw new Error(`SYNC 오류: ${line}`);
        result = collector.result;
        break;
      }
      if (!result) throw new Error("SYNC가 완료되지 않았습니다.");
      const after = await status();
      const createdDuringSync = after.latest - before.latest;
      const droppedDuringSync = after.dropped - before.dropped;
      const expectedAtSnapshot = before.pending + result.through - before.latest;
      const recordsDroppedBeforeSnapshot = expectedAtSnapshot - result.readings.length;
      const expectedAfterPending = before.pending + createdDuringSync - droppedDuringSync;
      console.log("[Charm BLE] SYNC state verified", {
        before,
        through: result.through,
        received: result.readings.length,
        after,
        createdDuringSync,
        droppedDuringSync,
      });
      if (after.latest < before.latest || after.dropped < before.dropped ||
          before.lastAck !== after.lastAck || result.through < before.latest ||
          result.through > after.latest || recordsDroppedBeforeSnapshot < 0 ||
          recordsDroppedBeforeSnapshot > droppedDuringSync ||
          expectedAfterPending !== after.pending) {
        throw new Error("동기화 중 기기 데이터가 변경되었습니다. 다시 동기화해 주세요.");
      }
      return { ...result, before, after };
    }),
    acknowledge: (sequence: number) => enqueue(async () => {
      parseInteger(String(sequence));
      const before = await status();
      if (sequence > before.latest) throw new Error("서버 ACK가 기기 최신 번호를 초과합니다.");
      const line = await command(`ACK ${sequence}`, (value) => value.startsWith("ACK,"), Math.max(timings.command, 5000));
      const f = line.split(",");
      if (f[1] === "ACCEPTED" && f.length === 5 && parseInteger(f[2]) === sequence) {
        parseInteger(f[3], 0, 20);
        parseInteger(f[4], 0, 20);
      } else if (!(f[1] === "IGNORED" && f.length === 3 && parseInteger(f[2]) === sequence)) {
        throw new Error(`ACK가 확인되지 않았습니다: ${line}`);
      }
      const after = await status();
      if (after.lastAck < sequence) throw new Error("ACK 저장 상태가 확인되지 않았습니다.");
      return after;
    }),
  };
}
