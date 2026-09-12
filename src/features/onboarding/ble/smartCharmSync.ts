import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/features/auth/store/authStore";
import { uploadSensorReadings } from "@/features/onboarding/api/onboardingApi";
import { logCharmDebug } from "../utils/charmLogger";
import { CharmOutbox } from "./charmOutbox";
import { connectSmartCharm, getSmartCharmConnection, type SmartCharmConnection } from "./smartCharmBle";

export const charmOutbox = new CharmOutbox(AsyncStorage);
const activeUploads = new Set<string>();
const captures = new WeakMap<SmartCharmConnection, { tail: Promise<void>; error: Error | null }>();
const LIVE_PAUSE_SETTLE_MS = 200;

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

function assertOwner(ownerId: string) {
  const auth = useAuthStore.getState();
  if (!auth.accessToken || String(auth.user?.id ?? "") !== ownerId) throw new Error("로그인 계정이 변경되었습니다. 참에 다시 연결해 주세요.");
  return auth;
}

function captureReadings(connection: SmartCharmConnection) {
  const existing = captures.get(connection);
  if (existing) return existing;
  const capture = { tail: Promise.resolve(), error: null as Error | null };
  captures.set(connection, capture);
  connection.session.setReadingHandler((reading) => {
    capture.tail = capture.tail.then(async () => {
      assertOwner(connection.ownerId);
      await charmOutbox.saveReadings(connection.ownerId, connection.serialNumber, [reading]);
    }).catch((error: unknown) => {
      capture.error = error instanceof Error ? error : new Error(String(error));
    });
  });
  return capture;
}

async function flushCapture(connection: SmartCharmConnection) {
  const capture = captureReadings(connection);
  await capture.tail;
  if (capture.error) throw capture.error;
}

async function runCollectStage<T>(stage: string, action: () => Promise<T>) {
  logCharmDebug(`[Charm BLE] ${stage} start`);
  try {
    const result = await action();
    logCharmDebug(`[Charm BLE] ${stage} success`);
    return result;
  } catch (error) {
    console.warn(`[Charm BLE] ${stage} failed`, error);
    throw error;
  }
}

export async function collectSmartCharm(connection: SmartCharmConnection) {
  try {
    assertOwner(connection.ownerId);
    const { ownerId, serialNumber, device, session } = connection;
    await runCollectStage("로컬 연결 정보 저장", () =>
      charmOutbox.remember(ownerId, serialNumber, device.id, connection.allowedServiceUuids));
    captureReadings(connection);
    await runCollectStage("TIME 설정", () => session.setTime(Math.floor(Date.now() / 1000)));
    const sync = await runCollectStage("STATUS 및 SYNC", () => session.syncReadings());
    await runCollectStage("수신 데이터 저장", async () => {
      await flushCapture(connection);
      assertOwner(ownerId);
      await charmOutbox.saveSync(ownerId, serialNumber, sync);
    });
    logCharmDebug("[Charm BLE] collect complete", {
      count: sync.readings.length,
      through: sync.through,
    });
    return sync;
  } catch (error) {
    console.warn("[Charm BLE] collect failed:", error);
    throw error;
  }
}

export async function registerSmartCharmBackend(ownerId: string, serial: string, backendId: number) {
  assertOwner(ownerId);
  await charmOutbox.bindBackend(ownerId, serial, backendId);
}

export async function uploadAndAcknowledgeSmartCharm(ownerId: string, serial: string, backendId: number) {
  assertOwner(ownerId);
  const key = `${ownerId}:${serial}`;
  if (activeUploads.has(key)) throw new Error("이 참의 동기화가 이미 진행 중입니다.");
  activeUploads.add(key);
  let sessionToResume: SmartCharmConnection["session"] | null = null;
  try {
    let box = await charmOutbox.read(ownerId, serial);
    if (!box) throw new Error("이 휴대폰에 참 연결 정보가 없습니다. 참 추가에서 다시 검색해 주세요.");
    if (box.backendDeviceId !== backendId || box.conflict) throw new Error("보관된 참 ID와 서버 등록 정보를 확인해 주세요.");
    const connection = getSmartCharmConnection(ownerId, serial) ?? await connectSmartCharm(box.bleDeviceId, ownerId, {
      expectedSerial: serial, allowedServiceUuids: box.allowedServiceUuids,
    });
    const { session } = connection;
    sessionToResume = session;
    captureReadings(connection);

    logCharmDebug("[Charm BLE] LIVE OFF before sync start");
    await session.setLive(false);
    await wait(LIVE_PAUSE_SETTLE_MS);
    logCharmDebug("[Charm BLE] LIVE OFF before sync success");

    // Persisted server proof survives a disconnect or process death before ACK confirmation.
    if (box.pendingAck !== null) {
      await flushCapture(connection);
      assertOwner(ownerId);
      const after = await session.acknowledge(box.pendingAck);
      await charmOutbox.confirmAck(ownerId, serial, box.pendingAck, after.lastAck);
    }
    await collectSmartCharm(connection);
    box = await charmOutbox.read(ownerId, serial);
    if (!box) throw new Error("전송 대기 데이터를 찾지 못했습니다.");
    // Only upload through the latest durable STATUS snapshot; newer live values wait for the next sync.
    const latest = box.latest;
    const readings = box.readings.filter((r) => r.measuredAt > 0 && r.sequence <= latest);
    if (!readings.length) {
      return { complete: box.readings.length === 0, pending: box.readings.length,
        message: box.readings.length ? "시각 미설정 또는 다음 동기화 대기 기록을 보관 중입니다. ACK하지 않았습니다." : "동기화되었습니다." };
    }
    const auth = assertOwner(ownerId);
    const response = await uploadSensorReadings(backendId, readings, auth.accessToken!, auth.tokenType);
    assertOwner(ownerId);
    await flushCapture(connection);
    box = await charmOutbox.recordServerAck(ownerId, serial, response.ackSequence, readings);
    if (box.pendingAck === null) {
      return { complete: false, pending: box.readings.length,
        message: "서버 전송은 완료했지만 ACK가 없거나 미저장·시각 미설정·누락 구간이 있어 기기 기록을 보존했습니다." };
    }
    assertOwner(ownerId);
    const after = await session.acknowledge(box.pendingAck);
    box = await charmOutbox.confirmAck(ownerId, serial, box.pendingAck, after.lastAck);
    return { complete: true, pending: box.readings.length, message: "서버 저장과 기기 ACK가 확인되었습니다." };
  } finally {
    if (sessionToResume && !sessionToResume.isClosed) {
      try {
        logCharmDebug("[Charm BLE] LIVE ON after sync start");
        await sessionToResume.setLive(true);
        logCharmDebug("[Charm BLE] LIVE ON after sync success");
      } catch (error) {
        console.warn("[Charm BLE] LIVE ON restore failed", error);
      }
    }
    activeUploads.delete(key);
  }
}
