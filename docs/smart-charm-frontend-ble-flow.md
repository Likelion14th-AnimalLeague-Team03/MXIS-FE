# Smart Charm Frontend BLE Flow

> 목적
>
> MXIS FE에서 Smart Charm 온보딩 시 Bluetooth 연결, DeviceId 확인, 센서 데이터 수신, Backend 업로드, ACK 처리까지 어떤 구조로 구현했는지 백엔드와 공유하기 위한 문서이다.
>
> Frontend는 제품 상태를 판단하지 않고, Smart Charm(Device)에서 받은 값을 DTO로 변환해 Backend로 전달한다.

---

# 1. 관련 프론트엔드 파일

```text
src/features/onboarding/screens/CharmScanScreen.tsx
```

역할:

- Android Bluetooth 권한 요청
- Smart Charm BLE Scan
- Service UUID 기반 필터링
- BLE Connect
- Service Discovery
- DeviceId Read
- TimeSync Write
- SensorReading Notify 구독
- PendingCount Notify 구독
- DroppedReadingCount Notify 구독
- SensorReading Batch Upload
- Upload 성공 시 ACK Write
- 참 등록 API 호출
- 다음 온보딩 화면으로 이동

```text
src/features/onboarding/ble/smartCharmBle.ts
```

역할:

- Smart Charm BLE UUID 상수 관리
- Base64 <-> ByteArray 변환
- Little Endian uint32 인코딩
- SensorReading 16 bytes 디코딩
- uint32 Little Endian 디코딩
- DeviceId UTF-8 String 디코딩
- TimeSync Write
- ACK Write

```text
src/features/onboarding/api/onboardingApi.ts
```

역할:

- BLE 연결 정책 조회
- 참 등록
- 등록된 참 목록 조회
- 온보딩 제품 목록 조회
- 제품-참 연결
- SensorReading Batch Upload

---

# 2. BLE UUID 구성

## Smart Charm Service

```text
Service UUID
8A100000-7B2C-4D55-9000-000000000001
```

Frontend는 BLE Scan 시 이 Service UUID를 기준으로 MXIS Smart Charm만 필터링한다.

---

## SensorReading

```text
Characteristic UUID
8A100001-7B2C-4D55-9000-000000000001
```

```text
Property
Read / Notify
```

```text
Direction
Device -> Android
```

```text
Payload
16 bytes, Little Endian
```

---

## Pending Count

```text
Characteristic UUID
8A100002-7B2C-4D55-9000-000000000001
```

```text
Property
Read / Notify
```

```text
Payload
uint16
```

---

## ACK

```text
Characteristic UUID
8A100003-7B2C-4D55-9000-000000000001
```

```text
Property
Write
```

```text
Direction
Android -> Device
```

```text
Payload
uint32, Little Endian
```

Frontend는 Backend 업로드가 성공한 뒤에만 ACK를 write한다.

---

## TimeSync

```text
Characteristic UUID
8A100004-7B2C-4D55-9000-000000000001
```

```text
Property
Write
```

```text
Direction
Android -> Device
```

```text
Payload
uint32, Little Endian
```

값:

```text
Unix seconds
```

Frontend는 BLE 연결 후 service discovery가 끝나면 TimeSync를 write한다.

---

## DroppedReadingCount

```text
Characteristic UUID
8A100008-7B2C-4D55-9000-000000000001
```

```text
Property
Read / Notify
```

```text
Direction
Device -> Android
```

```text
Payload
uint32, Little Endian
```

의미:

```text
RAM Ring Buffer가 가득 차서 overwrite된 reading 누적 개수
```

현재 프론트에서는 값을 디코딩할 수 있도록 구독만 처리해두었다.
개발/디버그 UI가 생기면 이 값을 화면에 표시할 수 있다.

---

## DeviceId

```text
Characteristic UUID
8A100009-7B2C-4D55-9000-000000000001
```

```text
Property
Read
```

```text
Direction
Device -> Android
```

```text
Payload
UTF-8 string, max 19 characters
```

```text
Format
SC-XXXXXXXXXXXXXXXX
```

예시:

```text
SC-A8F31C92739D0241
```

Frontend는 BLE 연결 후 이 값을 읽고, 영구 Smart Charm 식별자로 사용한다.

```text
deviceId = "SC-A8F31C92739D0241"
serialNumber = "SC-A8F31C92739D0241"
```

주의:

```text
BLE device.name, Android device.id, MAC address는 영구 Smart Charm identity로 사용하지 않는다.
```

---

# 3. Frontend BLE Scan Flow

```text
1. 참 온보딩 검색 화면 진입
2. Android Bluetooth 권한 요청
3. Backend connection-policy 조회
4. allowedServiceUuids 확보
5. BLE Scan 시작
6. Service UUID가 Smart Charm Service UUID와 일치하는 기기만 리스트에 표시
7. 사용자가 리스트에서 기기 선택
```

Frontend 기본 Service UUID:

```text
8A100000-7B2C-4D55-9000-000000000001
```

Backend connection-policy에서 UUID를 내려주면 해당 값을 우선 사용한다.
조회 실패 시 프론트 기본 UUID를 사용한다.

---

# 4. Frontend BLE Connect Flow

사용자가 Smart Charm을 선택하면 Frontend는 아래 순서로 처리한다.

```text
1. BLE Scan 중지
2. 선택한 BLE device connect
3. discoverAllServicesAndCharacteristics 실행
4. DeviceId Characteristic Read
5. SC-XXXXXXXXXXXXXXXX 값 획득
6. Backend 참 등록 API 호출
7. TimeSync Write
8. SensorReading Notify 구독
9. PendingCount Notify 구독
10. DroppedReadingCount Notify 구독
11. 일정 시간 동안 초기 SensorReading 수집
12. Backend Batch Upload
13. Backend 응답 ackSequence 확인
14. ackSequence를 ACK Characteristic에 Write
15. 다음 온보딩 화면으로 이동
```

---

# 5. DeviceId Read

Frontend는 연결 성공 후 반드시 다음 Characteristic을 읽는다.

```text
Service UUID
8A100000-7B2C-4D55-9000-000000000001

Characteristic UUID
8A100009-7B2C-4D55-9000-000000000001
```

응답 예:

```text
SC-A8F31C92739D0241
```

Frontend 검증 조건:

```text
1. 값이 비어 있으면 실패
2. "SC-"로 시작하지 않으면 실패
```

실패 시:

```text
Smart Charm 고유 ID를 확인할 수 없습니다.
```

---

# 6. Backend 참 등록 요청

DeviceId Read 성공 후 Frontend는 Backend에 참 등록을 요청한다.

요청에 사용하는 값:

```text
serialNumber = DeviceId Characteristic에서 읽은 SC-... 값
deviceName = BLE device name 또는 SmartCharm
macAddress = Android BLE device.id
```

예시:

```json
{
  "serialNumber": "SC-A8F31C92739D0241",
  "deviceName": "SmartCharm",
  "macAddress": "E1:72:16:0F:D4:F5"
}
```

중요:

```text
macAddress는 참고값으로만 사용한다.
Backend의 영구 Smart Charm 식별 기준은 serialNumber 또는 deviceId = SC-... 로 두는 것이 좋다.
```

등록 API가 중복 에러를 반환하는 경우:

```text
Frontend는 GET /devices로 등록된 기기 목록을 다시 조회하고,
serialNumber가 같은 기존 device를 찾아 다음 단계에 사용한다.
```

---

# 7. SensorReading Decode

## Payload

```text
Total size
16 bytes

Endian
Little Endian
```

## Byte Layout

```text
0~3    sequence          uint32
4~7    measuredAt        uint32
8~9    temperatureX100   int16
10~11  humidityX100      uint16
12~13  maxShockX100      uint16
14~15  motionCount       uint16
```

## Frontend DTO

```ts
type SensorReadingUploadItem = {
  sequence: number;
  measuredAt: number;
  temperature: number;
  humidity: number;
  maxShock: number;
  motionCount: number;
};
```

## 변환 규칙

```text
temperature = temperatureX100 / 100
humidity = humidityX100 / 100
maxShock = maxShockX100 / 100
motionCount = motionCount
```

예:

```text
temperatureX100 = 2405 -> 24.05
humidityX100 = 6794 -> 67.94
maxShockX100 = 12 -> 0.12
```

---

# 8. SensorReading Batch Upload

Frontend는 SensorReading Notify로 받은 값을 sequence 기준으로 모아 Backend에 업로드한다.

현재 프론트 구현에서는 온보딩 연결 직후 짧은 시간 동안 초기 SensorReading을 수집한 뒤 업로드한다.

```text
INITIAL_SYNC_COLLECT_MS = 2500
```

## Request URL

현재 프론트 코드:

```text
POST /api/v1/devices/{backendDeviceId}/sensor-readings/batch
```

여기서 path의 `backendDeviceId`는 Backend 참 등록 API 응답의 numeric id이다.

## Request Body

```json
{
  "deviceId": "SC-A8F31C92739D0241",
  "serialNumber": "SC-A8F31C92739D0241",
  "readings": [
    {
      "sequence": 41,
      "measuredAt": 1786448014,
      "temperature": 24.05,
      "humidity": 67.94,
      "maxShock": 0.12,
      "motionCount": 1
    }
  ]
}
```

Frontend 기준:

```text
body.deviceId = Smart Charm DeviceId Characteristic에서 읽은 SC-... 값
body.serialNumber = Smart Charm DeviceId Characteristic에서 읽은 SC-... 값
```

---

# 9. Backend Batch Upload Response

Backend는 저장에 성공한 가장 높은 sequence를 반환해야 한다.

예시:

```json
{
  "success": true,
  "data": {
    "ackSequence": 41
  }
}
```

또는 API 공통 래퍼가 없다면:

```json
{
  "ackSequence": 41
}
```

현재 프론트는 MXIS 공통 응답 형태를 기준으로 처리한다.

```ts
type SensorReadingBatchUploadResponse = {
  ackSequence?: number | null;
};
```

---

# 10. ACK Write

Frontend는 Backend Batch Upload가 성공한 뒤에만 ACK를 쓴다.

ACK Characteristic:

```text
8A100003-7B2C-4D55-9000-000000000001
```

Payload:

```text
ackSequence uint32, Little Endian
```

예:

```text
ackSequence = 40
payload = 28000000
```

Frontend 원칙:

```text
1. BLE 수신 직후 ACK하지 않는다.
2. Backend 업로드 성공 후 ACK한다.
3. Backend가 ackSequence를 반환하지 않으면 ACK하지 않는다.
4. 업로드 실패 시 ACK하지 않는다.
```

---

# 11. TimeSync Write

Frontend는 BLE 연결 후 service discovery가 끝나면 TimeSync를 write한다.

TimeSync Characteristic:

```text
8A100004-7B2C-4D55-9000-000000000001
```

Payload:

```text
현재 Unix seconds uint32, Little Endian
```

예:

```text
1000 decimal -> E8030000
```

---

# 12. PendingCount / DroppedReadingCount 처리

## PendingCount

```text
Characteristic UUID
8A100002-7B2C-4D55-9000-000000000001
```

현재 프론트:

```text
Notify 구독만 처리
개발/디버그 UI에는 아직 표시하지 않음
```

## DroppedReadingCount

```text
Characteristic UUID
8A100008-7B2C-4D55-9000-000000000001
```

현재 프론트:

```text
Notify 구독
uint32 Little Endian 디코딩 가능
개발/디버그 UI에는 아직 표시하지 않음
```

향후 개발 UI가 추가되면 아래 값을 표시할 수 있다.

```text
PendingCount
DroppedReadingCount
Last received sequence
Last ACK sequence
Last upload result
```

---

# 13. 제품-참 연결

참 등록이 완료되고 제품 선택 온보딩에서 사용자가 제품을 선택하면, Frontend는 제품-참 연결 API를 호출한다.

```text
POST /api/v1/products/{productId}/devices
```

Request Body:

```json
{
  "deviceId": 3,
  "role": "PRIMARY_SENSOR"
}
```

여기서 `deviceId`는 Backend에 등록된 참의 numeric id이다.

주의:

```text
BLE DeviceId Characteristic에서 읽은 SC-... 값과
Backend 등록 후 받은 numeric deviceId는 서로 다른 값이다.
```

정리:

```text
SC-... = Smart Charm 물리 기기 고유 식별자
Backend numeric deviceId = Backend DB에 등록된 기기 row id
```

---

# 14. 현재 프론트 구현상 중요한 구분

## Smart Charm 물리 ID

```text
SC-A8F31C92739D0241
```

용도:

- serialNumber
- Backend upload body.deviceId
- Backend upload body.serialNumber
- 영구 Smart Charm identity

## Backend numeric deviceId

```text
3
```

용도:

- URL path `/devices/{deviceId}/sensor-readings/batch`
- 제품-참 연결 API body의 `deviceId`
- 앱 라우팅 파라미터

---

# 15. Backend와 맞춰야 하는 확인 사항

## 15.1 참 등록 API

확인 필요:

```text
POST /api/v1/devices 요청 시 serialNumber = SC-... 값을 고유값으로 처리하는지
```

추천:

```text
serialNumber가 이미 존재하면 기존 device를 반환하거나,
중복 에러를 주더라도 GET /devices에서 해당 serialNumber를 찾을 수 있어야 한다.
```

---

## 15.2 SensorReading Batch Upload API

현재 프론트 payload:

```json
{
  "deviceId": "SC-A8F31C92739D0241",
  "serialNumber": "SC-A8F31C92739D0241",
  "readings": []
}
```

확인 필요:

```text
Backend가 body.deviceId / body.serialNumber를 string으로 받을 수 있는지
```

만약 Backend가 path의 numeric deviceId만 사용한다면, body의 string deviceId/serialNumber는 참고값으로 처리 가능하다.

---

## 15.3 ackSequence 응답 형식

Frontend는 다음 값을 기대한다.

```json
{
  "ackSequence": 41
}
```

MXIS 공통 응답이면:

```json
{
  "success": true,
  "data": {
    "ackSequence": 41
  }
}
```

확인 필요:

```text
Backend가 저장 성공한 highest contiguous sequence를 ackSequence로 내려주는지
```

---

# 16. 현재 프론트 구현 범위

구현됨:

- Bluetooth 권한 요청
- Service UUID 기반 BLE Scan
- BLE Connect
- Service Discovery
- DeviceId Characteristic Read
- TimeSync Write
- SensorReading Notify 구독
- SensorReading 16 bytes Little Endian 디코딩
- PendingCount Notify 구독
- DroppedReadingCount Notify 구독
- SensorReading Batch Upload
- Backend ackSequence 기반 ACK Write
- 참 등록
- 제품-참 연결

아직 UI 미구현:

- PendingCount 표시
- DroppedReadingCount 표시
- Last received sequence 표시
- Last ACK sequence 표시
- Last upload result 표시
- Battery percent 표시

Battery는 BLE 표준 서비스 `180F / 2A19`가 있으나, 현재 제품 단계에서 실제 배터리 하드웨어 검증 전까지는 운영 UI에 적극 표시하지 않는 방향이 적절하다.

---

# 17. 핵심 결론

Frontend는 Smart Charm을 다음 기준으로 처리한다.

```text
1. Service UUID로 MXIS Smart Charm만 검색
2. DeviceId Characteristic에서 SC-... 값을 읽음
3. SC-... 값을 serialNumber / 영구 Smart Charm identity로 사용
4. Backend 등록 후 받은 numeric deviceId는 API path와 제품 연결에 사용
5. SensorReading은 16 bytes Little Endian으로 디코딩
6. Backend 업로드 성공 후에만 ackSequence를 ACK Characteristic에 write
```

가장 중요한 데이터 구분:

```text
Service UUID
= Smart Charm 제품군 필터링용

SC-XXXXXXXXXXXXXXXX
= Smart Charm 물리 기기 고유 ID

Backend numeric deviceId
= Backend DB에 등록된 기기 ID

productId
= Backend DB에 등록된 MCM 제품 ID
```
