const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { test } = require("node:test");
const ts = require("typescript");

// Exercise the production TypeScript without loading React Native on the host.
require.extensions[".ts"] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  }).outputText, filename);
};
const root = path.resolve(__dirname, "../src/features/onboarding/ble");
const p = require(path.join(root, "smartCharmProtocol.ts"));
const { createUartSession } = require(path.join(root, "smartCharmUartSession.ts"));
const { CharmOutbox } = require(path.join(root, "charmOutbox.ts"));
const serial = "SC-OB-000001";
const owner = "42";
const bytes = (s) => Uint8Array.from(Buffer.from(s, "ascii"));
const reading = (sequence, measuredAt = 1800000000) => ({ sequence, measuredAt, temperature: 24.7, humidity: 45, maxShock: 0.09, motionCount: 0 });
const status = (latest, lastAck = 0, dropped = 0) => ({ pending: Math.min(20, latest - lastAck), latest, lastAck, dropped, time: 1800000000, storageState: 0 });
const snapshot = (readings, lastAck = 0, dropped = 0) => {
  const through = readings.at(-1)?.sequence ?? lastAck;
  return { readings, through, before: status(through, lastAck, dropped), after: status(through, lastAck, dropped) };
};
function frame(r) {
  const b = Buffer.alloc(16);
  b.writeUInt32LE(r.sequence, 0); b.writeUInt32LE(r.measuredAt, 4);
  b.writeInt16LE(Math.round(r.temperature * 100), 8);
  b.writeUInt16LE(Math.round(r.humidity * 100), 10);
  b.writeUInt16LE(Math.round(r.maxShock * 100), 12); b.writeUInt16LE(r.motionCount, 14);
  return `R,${r.sequence},${r.measuredAt},${Math.round(r.temperature * 100)},${Math.round(r.humidity * 100)},${Math.round(r.maxShock * 100)},${r.motionCount},${p.crc16CcittFalse(b).toString(16).toUpperCase().padStart(4, "0")}`;
}
function memoryStorage() {
  const data = new Map();
  return { data, getItem: async (k) => data.get(k) ?? null, setItem: async (k, v) => { data.set(k, v); } };
}
async function prepared(readings = [reading(1), reading(2)], lastAck = 0) {
  const storage = memoryStorage();
  const outbox = new CharmOutbox(storage);
  await outbox.remember(owner, serial, "radio-1");
  await outbox.saveSync(owner, serial, snapshot(readings, lastAck));
  await outbox.bindBackend(owner, serial, 28);
  return { storage, outbox, readings };
}
function radio(t, handle, options = {}) {
  let receive, fail, disconnected;
  const writes = [];
  const session = createUartSession({
    subscribe: (onValue, onError) => { receive = onValue; fail = onError; return () => {}; },
    onDisconnect: (onError) => { disconnected = onError; return () => {}; },
    write: async (value) => {
      const command = Buffer.from(p.base64ToBytes(value)).toString("ascii");
      assert(command.endsWith("\n") && !command.endsWith("\n\n"));
      assert(Buffer.byteLength(command) <= 20);
      writes.push(command.trim());
      await handle(command.trim(), emit);
    },
  }, { command: 100, sync: 400, progress: 100, busy: 1, ...options });
  function emit(text, chunkSize = 20) {
    for (let i = 0; i < text.length; i += chunkSize) receive(p.bytesToBase64(bytes(text.slice(i, i + chunkSize))));
  }
  t.after(() => session.dispose());
  return { session, writes, emit, fail: (e = new Error("radio error")) => fail(e), disconnect: () => disconnected(new Error("disconnected")) };
}

test("CRC matches standard vector and real firmware reading #150", () => {
  assert.equal(p.crc16CcittFalse(bytes("123456789")), 0x29b1);
  assert.deepEqual(p.parseSensorReadingLine("R,150,0,2480,4500,10,0,1FFE"), { ...reading(150, 0), temperature: 24.8, maxShock: 0.1 });
});
test("signed temperature and unsigned boundaries survive CRC parsing", () => {
  const r = { sequence: 0xffffffff, measuredAt: 0xffffffff, temperature: -327.68, humidity: 655.35, maxShock: 655.35, motionCount: 65535 };
  assert.deepEqual(p.parseSensorReadingLine(frame(r)), r);
  assert.throws(() => p.parseSensorReadingLine(frame(r).replace("-32768", "-32769")));
});
test("reject damaged CRC, extra fields, decimals, invalid numbers", () => {
  const valid = "R,150,0,2480,4500,10,0,1FFE";
  for (const bad of [valid.replace("2480", "2481"), valid + ",", valid.replace("150", "1.5"), valid.replace("150", "0"), valid.replace("4500", "-1")]) {
    assert.throws(() => p.parseSensorReadingLine(bad));
  }
});
test("Base64 agrees with Node for every length and rejects malformed payloads", () => {
  for (let length = 0; length < 128; length++) {
    const b = Uint8Array.from({ length }, (_, i) => (i * 97) & 255);
    const encoded = Buffer.from(b).toString("base64");
    assert.equal(p.bytesToBase64(b), encoded);
    assert.deepEqual(p.base64ToBytes(encoded), b);
  }
  for (const bad of ["a", "a===", "Zg==\n", "Zh==", "@@==", "A".repeat(8196)]) assert.throws(() => p.base64ToBytes(bad));
});
test("commands have exactly one LF and reject injection/oversized writes", () => {
  for (const c of ["PING", "PROFILE", "ID", "STATUS", "TIME 4294967295", "SYNC", "ACK 4294967295"]) assert.equal(Buffer.from(p.base64ToBytes(p.encodeCommand(c))).toString(), c + "\n");
  for (const c of ["PING\nACK 2", "ACK -1", "time 1", "A".repeat(21)]) assert.throws(() => p.encodeCommand(c));
});
test("UART joins all split positions, including CR/LF and multiple lines", () => {
  const text = "PONG\r\n" + frame(reading(1)) + "\r\nID," + serial + "\r\n";
  const expected = ["PONG", frame(reading(1)), "ID," + serial];
  for (let i = 0; i <= text.length; i++) {
    const decoder = new p.UartLineDecoder();
    assert.deepEqual([...decoder.push(bytes(text.slice(0, i))), ...decoder.push(bytes(text.slice(i)))], expected);
  }
  const decoder = new p.UartLineDecoder();
  assert.deepEqual([...text].flatMap((c) => decoder.push(bytes(c))), expected);
});
test("UART rejects NUL, non-ASCII, misplaced CR, overlong frame", () => {
  for (const text of ["A\x00B\n", "A\x80\n", "A\rB\n", "A".repeat(95)]) assert.throws(() => new p.UartLineDecoder().push(bytes(text)));
});
test("SYNC verifies complete 20 readings and deduplicates identical retransmissions", () => {
  const collector = new p.SyncCollector();
  collector.push("SYNC_BEGIN,20,150");
  for (let seq = 131; seq <= 150; seq++) { collector.push(frame(reading(seq))); collector.push(frame(reading(seq))); }
  collector.push("SYNC_END,20,150,20");
  assert.equal(collector.result.readings.length, 20);
  assert.equal(collector.result.readings[0].sequence, 131);
});
test("SYNC rejects missing BEGIN, missing records, order/conflict/count/boundary", () => {
  for (const lines of [
    ["SYNC_END,0,0,0"], ["SYNC_BEGIN,2,2", frame(reading(1)), "SYNC_END,2,2,2"],
    ["SYNC_BEGIN,2,2", frame(reading(2))], ["SYNC_BEGIN,1,1", frame(reading(2))],
    ["SYNC_BEGIN,1,1", frame(reading(1)), frame({ ...reading(1), temperature: 25 })],
    ["SYNC_BEGIN,0,0", "SYNC_BEGIN,0,0"], ["SYNC_BEGIN,0,0", "SYNC_END,0,1,0"],
  ]) assert.throws(() => { const c = new p.SyncCollector(); lines.forEach((l) => c.push(l)); });
});
test("STATUS validates ready-state consistency and storage flag", () => {
  assert.deepEqual(p.parseStatus("STATUS,2,2,0,0,1800000000,0"), status(2));
  for (const s of ["STATUS,21,21,0,0,0,0", "STATUS,1,2,3,0,0,0", "STATUS,3,2,0,0,0,0", "STATUS,0,0,0,0,0,3"]) assert.throws(() => p.parseStatus(s));
});
test("session subscribes before immediate response and serializes simultaneous commands", async (t) => {
  const h = radio(t, async (c, emit) => { emit(c === "PING" ? "PONG\r\n" : "ID," + serial + "\r\n"); });
  const [pong, id] = await Promise.all([h.session.ping(), h.session.readDeviceId()]);
  assert.equal(pong, "PONG"); assert.equal(id, serial); assert.deepEqual(h.writes, ["PING", "ID"]);
});
test("unrelated PONG cannot satisfy ID and BUSY retries stay in queue", async (t) => {
  let attempts = 0;
  const h = radio(t, (c, emit) => {
    if (c === "ID" && attempts++ === 0) emit("ERR,BUSY\r\n");
    else if (c === "ID") emit("PONG\r\nID," + serial + "\r\n");
    else emit("PONG\r\n");
  });
  const [id] = await Promise.all([h.session.readDeviceId(), h.session.ping()]);
  assert.equal(id, serial); assert.deepEqual(h.writes, ["ID", "ID", "PING"]);
});
test("PROFILE, ID and TIME must match exact contract", async (t) => {
  for (const [method, reply, args] of [["verifyProfile", "PROFILE,OTHER,1", []], ["readDeviceId", "ID,SmartCharm", []], ["setTime", "TIME,ACCEPTED,5", [6]]]) {
    const h = radio(t, (_, emit) => emit(reply + "\r\n"));
    await assert.rejects(h.session[method](...args));
  }
});
test("full SYNC holds command queue and handles END plus live R in same Notify", async (t) => {
  let statusCalls = 0;
  const captured = [];
  const h = radio(t, (c, emit) => {
    if (c === "STATUS") { statusCalls++; emit(`STATUS,${statusCalls === 1 ? 2 : 3},${statusCalls === 1 ? 2 : 3},0,0,1800000000,0\r\n`); }
    else if (c === "SYNC") emit(`SYNC_BEGIN,2,2\r\n${frame(reading(1))}\r\n${frame(reading(2))}\r\nSYNC_END,2,2,3\r\n${frame(reading(3))}\r\n`, 500);
    else emit("PONG\r\n");
  });
  h.session.setReadingHandler((r) => captured.push(r));
  const [result] = await Promise.all([h.session.syncReadings(), h.session.ping()]);
  assert.equal(result.readings.length, 2); assert.equal(captured.length, 3);
  assert.deepEqual(h.writes, ["STATUS", "SYNC", "STATUS", "PING"]);
});
test("SYNC rejects overflow or external ACK changes", async (t) => {
  for (const after of ["STATUS,1,1,0,1,0,0", "STATUS,0,1,1,0,0,0"]) {
    let calls = 0;
    const h = radio(t, (c, emit) => emit(c === "STATUS" ? (calls++ ? after : "STATUS,1,1,0,0,0,0") + "\r\n" : `SYNC_BEGIN,1,1\r\n${frame(reading(1))}\r\nSYNC_END,1,1,1\r\n`));
    await assert.rejects(h.session.syncReadings());
  }
});
test("SYNC cannot claim one record when STATUS proves two pending", async (t) => {
  const h = radio(t, (c, emit) => emit(c === "STATUS"
    ? "STATUS,2,2,0,0,0,0\r\n"
    : `SYNC_BEGIN,1,2\r\n${frame(reading(2))}\r\nSYNC_END,1,2,2\r\n`));
  await assert.rejects(h.session.syncReadings());
});
test("ACK requires EEPROM-ready STATUS after matched response", async (t) => {
  let acked = false;
  const h = radio(t, (c, emit) => {
    if (c === "STATUS") emit(acked ? "STATUS,0,2,2,0,0,0\r\n" : "STATUS,2,2,0,0,0,0\r\n");
    else { acked = true; emit("ACK,ACCEPTED,2,2,0\r\n"); }
  });
  assert.equal((await h.session.acknowledge(2)).lastAck, 2);
  assert.deepEqual(h.writes, ["STATUS", "ACK 2", "STATUS"]);
});
test("future ACK never reaches Write, stale confirmation fails", async (t) => {
  const h = radio(t, (c, emit) => emit(c === "STATUS" ? "STATUS,1,1,0,0,0,0\r\n" : "ACK,ACCEPTED,1,1,0\r\n"));
  await assert.rejects(h.session.acknowledge(2));
  assert.deepEqual(h.writes, ["STATUS"]);
  await assert.rejects(h.session.acknowledge(1));
});
test("timeout closes session, rejects queued work and ignores late callback", async (t) => {
  const h = radio(t, () => {}, { command: 15 });
  const settled = await Promise.allSettled([h.session.ping(), h.session.readDeviceId()]);
  assert(settled.every((r) => r.status === "rejected")); assert(h.session.isClosed);
  h.emit("PONG\r\n"); await assert.rejects(h.session.ping()); assert.deepEqual(h.writes, ["PING"]);
});
test("disconnect, malformed frame and write failure reject without hanging", async (t) => {
  for (const reason of ["disconnect", "frame", "write"]) {
    const h = radio(t, (_, emit) => {
      if (reason === "write") throw new Error("write failed");
      if (reason === "frame") emit("\x00\n");
      else h.disconnect();
    });
    await assert.rejects(h.session.ping()); assert(h.session.isClosed);
  }
});
test("response received but native Write never settles still times out", async (t) => {
  const h = radio(t, (_, emit) => { emit("PONG\r\n"); return new Promise(() => {}); }, { command: 15 });
  await assert.rejects(h.session.ping());
  assert(h.session.isClosed);
});
test("EEPROM busy polling recovers; persistent busy/fault stop sync", async (t) => {
  let n = 0;
  const h = radio(t, (_, emit) => emit(`STATUS,0,0,0,0,0,${n++ ? 0 : 1}\r\n`));
  assert.equal((await h.session.getStatus()).storageState, 0);
  assert.equal(h.writes.length, 2);
  for (const state of [1, 2]) {
    const blocked = radio(t, (_, emit) => emit(`STATUS,0,0,0,0,0,${state}\r\n`));
    await assert.rejects(blocked.session.syncReadings());
    assert(!blocked.writes.includes("SYNC"));
  }
});
test("SYNC missing END expires progress timer and closes session", async (t) => {
  const h = radio(t, (c, emit) => emit(c === "STATUS" ? "STATUS,1,1,0,0,0,0\r\n" : `SYNC_BEGIN,1,1\r\n${frame(reading(1))}\r\n`), { progress: 15 });
  await assert.rejects(h.session.syncReadings());
  assert(h.session.isClosed);
});
test("outbox merges concurrent writes and isolates account and device", async () => {
  const { outbox } = await prepared();
  await Promise.all([outbox.saveReadings(owner, serial, [reading(3)]), outbox.saveReadings(owner, serial, [reading(4)])]);
  assert.deepEqual((await outbox.read(owner, serial)).readings.map((r) => r.sequence), [1, 2, 3, 4]);
  assert.equal(await outbox.read("other", serial), null);
  assert.equal(await outbox.read(owner, "SC-OB-000002"), null);
});
test("server proof persists before deletion, resumes after restart, removes only confirmed prefix", async () => {
  const { storage, outbox, readings } = await prepared();
  const saved = await outbox.recordServerAck(owner, serial, 1, readings);
  assert.equal(saved.pendingAck, 1); assert.equal(saved.readings.length, 2);
  const restarted = new CharmOutbox(storage);
  assert.equal((await restarted.read(owner, serial)).pendingAck, 1);
  await assert.rejects(restarted.confirmAck(owner, serial, 1, 0));
  const confirmed = await restarted.confirmAck(owner, serial, 1, 1);
  assert.equal(confirmed.pendingAck, null); assert.equal(confirmed.acknowledgedThrough, 1);
  assert.deepEqual(confirmed.readings.map((r) => r.sequence), [2]);
});
test("missing/duplicate/future/malformed ACK never clears readings", async () => {
  const { outbox, readings } = await prepared();
  for (const ack of [null, undefined, 0]) assert.equal((await outbox.recordServerAck(owner, serial, ack, readings)).pendingAck, null);
  for (const ack of [3, -1, 1.5, "2"]) await assert.rejects(outbox.recordServerAck(owner, serial, ack, readings));
  assert.equal((await outbox.read(owner, serial)).readings.length, 2);
});
test("time-zero, overflow gaps and missing upload prefix block cumulative ACK", async () => {
  for (const readings of [[reading(1, 0), reading(2)], [reading(2), reading(3)]]) {
    const { outbox } = await prepared(readings);
    const result = await outbox.recordServerAck(owner, serial, readings.at(-1).sequence, readings.filter((r) => r.measuredAt));
    assert.equal(result.pendingAck, null); assert.equal(result.readings.length, 2);
  }
  const { outbox } = await prepared();
  assert.equal((await outbox.recordServerAck(owner, serial, 2, [reading(2)])).pendingAck, null);
});
test("collision is sticky, wrong backend and device reset block ACK", async () => {
  const { outbox } = await prepared();
  await assert.rejects(outbox.bindBackend(owner, serial, 29));
  await assert.rejects(outbox.saveSync(owner, serial, snapshot([reading(1)])));
  await assert.rejects(outbox.saveReadings(owner, serial, [{ ...reading(1), temperature: 30 }]));
  const box = await outbox.read(owner, serial);
  assert(box.conflict); assert.equal(box.readings[0].temperature, 24.7);
  await assert.rejects(outbox.recordServerAck(owner, serial, 2, box.readings));
});
test("corrupt storage and failed durable write are surfaced, never cleared", async () => {
  const { storage, outbox, readings } = await prepared();
  const original = [...storage.data.values()][0];
  storage.setItem = async () => { throw new Error("disk full"); };
  await assert.rejects(outbox.recordServerAck(owner, serial, 2, readings), /disk full/);
  assert.equal([...storage.data.values()][0], original);
  storage.data.set([...storage.data.keys()][0], "{broken");
  await assert.rejects(outbox.read(owner, serial));
  assert.equal([...storage.data.values()][0], "{broken");
});

const originalLoad = Module._load;
let nativeDevices = new Map();
let syncDependencies = null;
let httpPost;
Module._load = function (request, parent, ...rest) {
  if (request === "@/shared/api/client" && parent?.filename.endsWith("/onboardingApi.ts")) return { apiClient: { post: (...args) => httpPost(...args) } };
  if (request === "react-native-ble-plx") return { BleManager: class {
    async connectToDevice(id) { const device = nativeDevices.get(id); if (!device) throw new Error("missing test radio"); return device; }
    async isDeviceConnected() { return true; }
    async cancelDeviceConnection() {}
  } };
  if (parent?.filename === path.join(root, "smartCharmSync.ts")) {
    if (request === "@react-native-async-storage/async-storage") return { __esModule: true, default: syncDependencies.storage };
    if (request === "@/features/auth/store/authStore") return { useAuthStore: { getState: () => syncDependencies.auth } };
    if (request === "@/features/onboarding/api/onboardingApi") return { uploadSensorReadings: (...args) => syncDependencies.upload(...args) };
    if (request === "./smartCharmBle") return syncDependencies.ble;
  }
  return originalLoad.call(this, request, parent, ...rest);
};
const native = require(path.join(root, "smartCharmBle.ts"));
test("native scan policy requires advertised NUS, never name-only or old UUID", () => {
  const uuid = p.SMART_CHARM_NUS_SERVICE_UUID;
  assert(native.isSmartCharmDevice({ serviceUUIDs: [uuid.toLowerCase()] }, [uuid]));
  assert(!native.isSmartCharmDevice({ name: "SmartCharm", serviceUUIDs: [] }, [uuid]));
  assert.throws(() => native.resolveOrangeScanPolicy(["8A100000-7B2C-4D55-9000-000000000001"]));
  assert.throws(() => native.resolveOrangeScanPolicy([]));
  assert.throws(() => native.resolveOrangeScanPolicy([null]));
  assert.deepEqual(native.resolveOrangeScanPolicy(), [uuid]);
});
test("native discovery rejects arbitrary writable service and wrong NUS properties", async () => {
  const device = { services: async () => [{ uuid: "unrelated" }] };
  await assert.rejects(native.createSmartCharmUartSession(device));
  device.services = async () => [{ uuid: p.SMART_CHARM_NUS_SERVICE_UUID }];
  device.characteristicsForService = async () => [{ uuid: p.SMART_CHARM_NUS_WRITE_CHARACTERISTIC_UUID, isWritableWithResponse: true }];
  await assert.rejects(native.createSmartCharmUartSession(device));
});
function nativeDevice(id, deviceSerial = serial, withResponse = true) {
  let listener;
  const calls = [];
  const device = {
    id, calls,
    async discoverAllServicesAndCharacteristics() { calls.push("discover"); },
    async services() { return [{ uuid: p.SMART_CHARM_NUS_SERVICE_UUID }]; },
    async characteristicsForService() { return [
      { uuid: p.SMART_CHARM_NUS_WRITE_CHARACTERISTIC_UUID, isWritableWithResponse: withResponse, isWritableWithoutResponse: true },
      { uuid: p.SMART_CHARM_NUS_NOTIFY_CHARACTERISTIC_UUID, isNotifiable: true },
    ]; },
    monitorCharacteristicForService(_, __, callback) { calls.push("subscribe"); listener = callback; return { remove() {} }; },
    onDisconnected() { return { remove() {} }; },
    async cancelConnection() { calls.push("cancel"); },
  };
  const write = async (mode, service, characteristic, encoded) => {
    assert.equal(service, p.SMART_CHARM_NUS_SERVICE_UUID);
    assert.equal(characteristic, p.SMART_CHARM_NUS_WRITE_CHARACTERISTIC_UUID);
    const command = Buffer.from(p.base64ToBytes(encoded)).toString().trim();
    calls.push(mode + ":" + command);
    const reply = command === "PING" ? "PONG" : command === "PROFILE" ? p.SMART_CHARM_PROFILE : "ID," + deviceSerial;
    const data = reply + "\r\n";
    for (let i = 0; i < data.length; i += 20) listener(null, { value: p.bytesToBase64(bytes(data.slice(i, i + 20))) });
  };
  device.writeCharacteristicWithResponseForService = (...args) => write("response", ...args);
  device.writeCharacteristicWithoutResponseForService = (...args) => write("no-response", ...args);
  nativeDevices.set(id, device);
  return device;
}
test("native handshake subscribes first, verifies profile/ID and maintains screen handoff", async (t) => {
  t.after(() => native.disconnectSmartCharmConnection());
  const device = nativeDevice("native-1");
  const connection = await native.connectSmartCharm(device.id, owner);
  assert.equal(connection.serialNumber, serial);
  assert.deepEqual(device.calls, ["discover", "subscribe", "response:PING", "response:PROFILE", "response:ID"]);
  assert.equal(native.getSmartCharmConnection(owner, serial), connection);
  assert.equal(await native.connectSmartCharm(device.id, owner), connection);
  assert.equal(native.getSmartCharmConnection("other", serial), null);
});
test("native reconnect rejects a different serial before ACK and supports write-without-response", async (t) => {
  t.after(() => native.disconnectSmartCharmConnection());
  const device = nativeDevice("native-2", "SC-OB-000002", false);
  await assert.rejects(native.connectSmartCharm(device.id, owner, { expectedSerial: serial }));
  assert(device.calls.includes("no-response:ID"));
  assert(device.calls.includes("cancel"));
  assert(!device.calls.some((c) => c.includes("ACK")));
});

const api = require(path.resolve(root, "../api/onboardingApi.ts"));
test("HTTP adapter keeps backend DTO mapping and uploads all valid records", async (t) => {
  t.mock.method(console, "log", () => {});
  const readings = [reading(1, 0), reading(2), reading(3)];
  httpPost = async (url, body, options) => {
    assert.equal(url, "/devices/28/sensor-readings/batch");
    assert.equal(options.headers.Authorization, "Bearer test-token");
    assert.deepEqual(body.readings.map((r) => r.sequenceNumber), [2, 3]);
    assert.equal(body.readings[0].temperature, 24.7);
    assert.equal(body.readings[0].maxShockLevel, 0.09);
    assert.match(body.readings[0].measuredAt, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/);
    return { data: { success: true, data: { ackSequence: 3 } } };
  };
  assert.deepEqual(await api.uploadSensorReadings(28, readings, "test-token"), { ackSequence: 3 });
});
test("HTTP adapter accepts explicit ACK variants, never invents an absent ACK", async (t) => {
  t.mock.method(console, "log", () => {});
  for (const body of [null, "", {}, { success: true, data: null }, { success: true, data: {} }]) {
    httpPost = async () => ({ data: body });
    assert.equal((await api.uploadSensorReadings(28, [reading(1)], "test-token")).ackSequence ?? null, null);
  }
  httpPost = async () => ({ data: { ackSequence: 1 } });
  assert.equal((await api.uploadSensorReadings(28, [reading(1)], "test-token")).ackSequence, 1);
});
test("HTTP adapter rejects application errors, invalid ACK and network failures", async (t) => {
  t.mock.method(console, "log", () => {}); t.mock.method(console, "error", () => {});
  for (const body of [{ success: false, error: { message: "rejected" } }, { ackSequence: "1" }, { ackSequence: -1 }, { ackSequence: 1.2 }, { ackSequence: 4294967296 }, "invalid"]) {
    httpPost = async () => ({ data: body });
    await assert.rejects(api.uploadSensorReadings(28, [reading(1)], "test-token"));
  }
  httpPost = async () => { throw new Error("Network Error"); };
  await assert.rejects(api.uploadSensorReadings(28, [reading(1)], "test-token"), /Network Error/);
});

async function workflow(t, { readings = [reading(1), reading(2)], uploadError, ack = 2, failAck = false } = {}) {
  const storage = memoryStorage();
  const events = [];
  let lastAck = 0;
  let liveReadings = [...readings];
  const latest = readings.at(-1)?.sequence ?? 0;
  const connection = { ownerId: owner, serialNumber: serial, device: { id: "radio-1" }, session: {
    setReadingHandler(handler) { this.handler = handler; },
    async setTime() { events.push("time"); },
    async syncReadings() { return { ...snapshot(liveReadings, lastAck), through: latest, before: status(latest, lastAck), after: status(latest, lastAck) }; },
    async acknowledge(value) {
      const proof = JSON.parse([...storage.data.values()][0]);
      assert.equal(proof.pendingAck, value, "must durably record server proof before BLE ACK");
      events.push("ack:" + value);
      if (failAck) throw new Error("ACK disconnected");
      lastAck = value; liveReadings = liveReadings.filter((r) => r.sequence > value);
      return status(latest, value);
    },
  } };
  syncDependencies = {
    storage, auth: { accessToken: "test-token", user: { id: Number(owner) }, tokenType: "Bearer" },
    upload: async (_, uploaded) => {
      events.push("upload:" + uploaded.map((r) => r.sequence).join(","));
      if (uploadError) throw new Error(uploadError);
      return { ackSequence: ack };
    },
    ble: { getSmartCharmConnection: () => connection, connectSmartCharm: async (_, __, options) => {
      assert.equal(options.expectedSerial, serial); events.push("reconnect"); return connection;
    } },
  };
  const modulePath = path.join(root, "smartCharmSync.ts");
  delete require.cache[modulePath];
  const coordinator = require(modulePath);
  await coordinator.collectSmartCharm(connection);
  await coordinator.registerSmartCharmBackend(owner, serial, 28);
  return { coordinator, connection, events, storage, setAckFailure: (value) => { failAck = value; } };
}
test("workflow uploads full batch then persists proof, ACKs, confirms and removes", async (t) => {
  const w = await workflow(t);
  const result = await w.coordinator.uploadAndAcknowledgeSmartCharm(owner, serial, 28);
  assert(result.complete);
  assert(w.events.indexOf("upload:1,2") < w.events.indexOf("ack:2"));
  assert.equal((await w.coordinator.charmOutbox.read(owner, serial)).readings.length, 0);
});
test("workflow network failure and no-ACK success keep data and send no ACK", async (t) => {
  for (const options of [{ uploadError: "Network Error" }, { ack: null }, { ack: 100 }]) {
    const w = await workflow(t, options);
    if (options.uploadError || options.ack === 100) await assert.rejects(w.coordinator.uploadAndAcknowledgeSmartCharm(owner, serial, 28));
    else assert(!(await w.coordinator.uploadAndAcknowledgeSmartCharm(owner, serial, 28)).complete);
    assert(!w.events.some((e) => e.startsWith("ack:")));
    assert.equal((await w.coordinator.charmOutbox.read(owner, serial)).readings.length, 2);
  }
});
test("workflow excludes time zero from upload but never ACKs past it", async (t) => {
  const w = await workflow(t, { readings: [reading(1, 0), reading(2)] });
  assert(!(await w.coordinator.uploadAndAcknowledgeSmartCharm(owner, serial, 28)).complete);
  assert(w.events.includes("upload:2")); assert(!w.events.includes("ack:2"));
});
test("workflow restarts/reconnects and replays stored server ACK without new upload", async (t) => {
  const w = await workflow(t, { failAck: true });
  await assert.rejects(w.coordinator.uploadAndAcknowledgeSmartCharm(owner, serial, 28));
  assert.equal((await w.coordinator.charmOutbox.read(owner, serial)).pendingAck, 2);
  w.setAckFailure(false);
  syncDependencies.ble.getSmartCharmConnection = () => null;
  delete require.cache[path.join(root, "smartCharmSync.ts")];
  const restarted = require(path.join(root, "smartCharmSync.ts"));
  assert((await restarted.uploadAndAcknowledgeSmartCharm(owner, serial, 28)).complete);
  assert.equal(w.events.filter((e) => e.startsWith("upload:")).length, 1);
  assert(w.events.includes("reconnect"));
});
test("workflow blocks account change and wrong backend before upload/ACK", async (t) => {
  const w = await workflow(t);
  await assert.rejects(w.coordinator.uploadAndAcknowledgeSmartCharm(owner, serial, 29));
  syncDependencies.auth.user.id = 43;
  await assert.rejects(w.coordinator.uploadAndAcknowledgeSmartCharm(owner, serial, 28));
  assert(!w.events.some((e) => /^(upload:|ack:)/.test(e)));
});
