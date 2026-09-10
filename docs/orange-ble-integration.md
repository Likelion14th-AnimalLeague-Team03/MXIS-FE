# Orange Smart Charm 프론트 연동 변경 및 검증

작성일: 2026-09-10

대상: `MXIS-FE`의 `onjunku` 기준 커밋 `2d89c93b8974d362978466687f2fd49e2ff33944`에서 분기한 `feature/orange-ble-integration` 브랜치.

이번 작업은 **프론트 코드 변경**이다. 기존 `onjunku` 브랜치와 분리하며, 펌웨어 및 서버는 변경하지 않았다.
타입 검사, 자동 테스트, Android JavaScript 번들 생성은 검증했지만 실물 Android/보드 및 실제 서버 연동은 아직 검증하지 않았다.

## 검색 결과가 비어 있을 때

기존 전체 BLE 검색을 엄격한 NUS 광고 UUID 필터로 바꾸면서, **GATT에는 서비스가 있어도 광고에 UUID가 없는 모듈**을 검색하지 못할 수 있는 조건이 생겼다. 실제 보드가 이 조건인지 아직 확정한 것은 아니다. `serviceUUIDs`는 검색 중 보이는 UUID이며 연결 후 서비스 목록과 다르다. [BLE 라이브러리 문서](https://dotintent.github.io/react-native-ble-plx/#deviceserviceuuids)

검색 화면에 두 모드를 제공한다.

| 탭 | 검색 방식 | 연결 조건 |
| --- | --- | --- |
| 참 UUID 검색 | NUS 광고 UUID 필터 | NUS GATT/속성, PING/PROFILE/ID 검사 |
| 주변 BLE | 광고 Service UUID 필터 없이 주변 BLE 후보 표시 | 위와 동일한 검사. 이름/광고만으로 자동 등록하지 않음 |

1. `참 UUID 검색`이 비면 `주변 BLE` 탭을 누른다.
2. `SmartCharmOBLE` 등 실제 모듈을 선택한다. 같은 이름은 표시된 BLE 식별값으로 구분한다. 목록의 후보는 아직 검증된 참이 아니다.
3. 주변 검색에서는 보이고 UUID 검색에서는 안 보이면 nRF Connect의 **광고 상세**에서 UUID 포함 여부를 확인한다. 연결 후 GATT 화면만으로 판단하지 않는다.
4. 빨간 오류에 `서버 검색 정책`이 나오면 서버의 NUS 허용 설정을 확인한다. 이때 주변 BLE 검색은 진단 목적으로 가능하지만, 기기 연결/등록은 허용하지 않는다.
5. 주변 BLE도 0개라면 권한, Bluetooth 전원, 다른 앱의 기기 연결, 보드 광고를 확인한다. Classic 전용 HC-06은 이 BLE 검색 대상이 아니다.

`Unknown`/`Resetting` 상태는 최대 4초 동안 Bluetooth 초기화를 기다린다. 전원 꺼짐/권한 거부/미지원/초기화 지연은 구분해 표시한다. 큰 빈 결과 이미지를 줄여 오류와 검색 탭이 화면 아래로 밀리지 않게 했다.

앱 로그의 `server scan policy`, `scan blocked by policy`, `scan started`, `scan finished`를 비교한다. 개발 빌드에는 `advertisement`의 이름/ID/광고 UUID도 출력한다. 이 진단 경로는 엄격한 광고 UUID 필터를 기본값에서 제거하거나 서버 정책을 무시하는 변경이 아니다.

## 1. 현재 지원 하드웨어와 UUID

| 구분 | 현재 대상 |
| --- | --- |
| 보드 | Orange Board BLE, ATmega328P + 기본 BLE UART 모듈 |
| 센서 | DHT11, MPU6050 |
| 펌웨어 | `SmartCharmOrangeBLE`, `PROFILE` 명령 지원 버전 |
| 프로토콜 | ASCII 명령/응답 + 줄바꿈, 센서 CRC |
| Service | `6E400001-B5A3-F393-E0A9-E50E24DCCA9E` |
| 앱에서 쓰기 | `6E400002-B5A3-F393-E0A9-E50E24DCCA9E` |
| 앱에서 Notify 구독 | `6E400003-B5A3-F393-E0A9-E50E24DCCA9E` |
| 기기 ID | `ID` 응답의 `SC-OB-000001` 형식, 보드마다 다른 번호 필요 |
| 배터리 | 현재 하드웨어 미지원 |

이 UUID는 기본 Nordic UART Service(NUS) 구성이다. **실물 모듈의 광고 UUID 및 Write/Notify 속성은 nRF Connect에서 확인해야 한다.** 다른 설정의 모듈에서는 임의 서비스를 대신 선택하지 않고 연결 준비를 중단한다.

기존 ESP32/XIAO의 `8A1000xx` 서비스와 16바이트 직접 Notify는 이 경로에서 지원하지 않는다. 16바이트 포맷은 CRC 검증을 위한 내부 재구성에만 사용한다.

NUS UUID는 다른 제품도 사용한다. UUID로 후보를 좁힌 후 `PING`, `PROFILE`, `ID`를 확인한다. 이것은 프로토콜 확인이며 암호학적 기기 인증은 아니다. 이름이나 휴대폰의 BLE 식별값을 제품 시리얼로 대체하지 않는다.

## 2. 실제 앱 흐름

```text
로그인
  -> 검색 정책 확인 + Bluetooth 권한/전원 확인
  -> NUS Service UUID로 Scan (주변 BLE 탭에서는 광고 필터 없이 후보 검색)
  -> BLE Connect + Service/Characteristic Discovery
  -> 정확한 Notify UUID 구독
  -> PING -> PROFILE -> ID
  -> TIME <현재 Unix 초>
  -> STATUS -> SYNC_BEGIN -> R 여러 개 -> SYNC_END -> STATUS
  -> CRC, 개수, 연속 번호, Dropped/ACK 변화 검사
  -> 계정 + 기기 ID별 휴대폰 전송 대기열에 저장
  -> 서버에 기기 등록 / 이미 등록된 동일 시리얼 조회
  -> 제품 연결
  -> 다시 SYNC하여 최신 대기 데이터 합치기
  -> 서버 센서 batch 업로드
  -> 서버 ackSequence와 실제 업로드 범위 검증
  -> 보류 ACK를 휴대폰에 먼저 저장
  -> ACK <sequence>
  -> ACK 응답 및 EEPROM-ready STATUS 확인
  -> 확인된 구간만 휴대폰 전송 대기열에서 제거
```

제품 연결 화면으로 이동해도 BLE 세션을 즉시 종료하지 않는다. 앱 재시작/무선 끊김 이후에는 보관한 BLE 식별값으로 재연결하고 `PROFILE/ID`로 같은 참인지 확인한다. 재연결 주소가 바뀌었으면 참 추가 화면에서 다시 검색한다.

한 번에 한 명령만 전송한다. 특히 전체 SYNC가 진행 중일 때 TIME/STATUS/ACK가 끼어들지 않는다. `ERR,BUSY`는 제한된 횟수로 재시도하고, 응답 시간 초과나 프레임 손상은 세션을 닫아 이전 응답이 다음 요청과 섞이지 않게 한다.

## 3. 전체 데이터 수신

- Notify 콜백 1개를 기록 1개로 보지 않는다. 조각을 줄 끝까지 모으고, 한 콜백에 여러 줄이면 모두 처리한다.
- `R`의 숫자 범위와 CRC-16/CCITT-FALSE를 검증한다.
- SYNC 시작 개수와 고유 수신 개수, 종료 개수가 모두 같아야 완료한다.
- 같은 기록이 중복 도착하면 합친다. 같은 시리얼/sequence에 다른 값이 오면 충돌로 차단한다.
- SYNC 도중 기록 누락, 순서 오류, 버퍼 넘침, 다른 연결의 ACK가 발견되면 완료 처리하지 않는다.
- 15초는 성공으로 간주하는 수집 시간이 아니라 최대 제한 시간이다. `SYNC_END`가 없으면 실패한다.
- 실시간으로 새로 받은 기록도 휴대폰에 보관한다. 다만 업로드는 마지막 정상 STATUS가 확인한 durable 최신 번호까지로 제한한다.

따라서 기기에 20개가 정상 보관되어 있고 전송 도중 넘침/삭제가 없다면 **20개 전체를 수신**한다. 1개 Read와 새 Notify 몇 개만 받는 흐름이 아니다.

## 4. 데이터 삭제 원칙

| 상황 | 서버 업로드 | 기기 ACK / 휴대폰 삭제 |
| --- | --- | --- |
| 전체 수신, 정상 시각, 유효한 서버 ACK | 수행 | 확인된 누적 구간만 처리 |
| HTTP 성공이나 응답에 ACK 없음 | 수행 | 하지 않음 |
| HTTP 오류 / Network Error | 실패 표시 | 하지 않음, 재시도 가능 |
| 서버 ACK가 업로드 또는 기기 범위를 초과 | 오류 표시 | 하지 않음, 임의 보정 금지 |
| CRC/수신 개수 오류 | 해당 동기화 업로드 중단 | 하지 않음 |
| ACK 전송 중 연결 끊김 | 서버 저장 근거 보관 | 재연결 후 같은 ACK 확인 |
| `measuredAt=0` 기록 | 해당 기록 제외, 원본 보관 | 그 기록을 넘어서는 누적 ACK 보류 |
| 이전 ACK 이후 번호 누락 | 받은 정상 시각 기록은 업로드 가능 | 누락을 넘어서는 누적 ACK 보류 |

**중요: 서버가 받은 데이터의 최대 번호를 돌려줬다는 이유만으로 그 앞의 미저장 기록을 삭제하지 않는다.**

예: 마지막 ACK가 92인데 기기에는 131~150만 남아 있다면 93~130의 저장 근거가 없다. 또는 131의 시각이 0이면 업로드되지 않는다. 현재 프론트는 이런 구간을 ACK 150으로 덮어 지우지 않는다. 서버의 누락/시각 미상 처리 계약을 먼저 정해야 하며, 임의 현재 시각 부여나 테스트 목적의 자동 ACK로 해결하지 않는다.

휴대폰 대기열은 계정 ID + 기기 시리얼별로 구분하며 재연결 시 덮어쓰지 않고 합친다. 앱 삭제/데이터 초기화까지 견디는 저장소는 아니다. 기기 버퍼의 최대 20개와 overflow 정책도 그대로이므로 무제한 무손실을 보장하지 않는다.

## 5. 수정 파일

경로의 공통 시작은 `src/features/onboarding/`이다.

| 파일 | 변경 |
| --- | --- |
| `ble/smartCharmProtocol.ts` | UUID, ASCII/Base64, 줄 재조립, 숫자/CRC/STATUS/SYNC 검증 |
| `ble/smartCharmUartSession.ts` | 명령 큐, PING/PROFILE/ID/TIME/STATUS/SYNC/ACK, 타임아웃, 끊김 처리 |
| `ble/smartCharmBle.ts` | BLE 관리자 공유, 정확한 NUS 검색/구독, ID 재확인, 연결 유지 |
| `ble/charmOutbox.ts` | 계정/시리얼별 영구 대기열, 충돌 차단, 서버 ACK 보관/확정 |
| `ble/smartCharmSync.ts` | 수집 -> 영구 저장 -> 서버 업로드 -> ACK 전체 흐름 |
| `screens/CharmScanScreen.tsx` | UUID/주변 BLE 검색 모드, 광고 진단 로그, 단계별 오류, 전체 동기화, 서버 등록, 화면 간 연결 전달 |
| `screens/ProductConfirmScreen.tsx` | 업로드 이후 실제 ACK 호출, 실패 데이터 보관, 재시도/등록 계속 |
| `api/onboardingApi.ts` | ACK 응답 검증, 서버 응답 없음/HTTP 오류 구분, 토큰 일부 출력 제거 |
| `src/features/device/screens/DeviceScreen.tsx` | 센서 동기화 버튼, 서버 화면 캐시 갱신, 배터리 미지원, 실제 저장 시각 표시 |
| `src/providers/AppProvider.tsx` | 로그아웃/계정 변경 시 BLE 종료 |
| `src/shared/components/SecondaryButton.tsx` | 검색/연결 중 중복 실행 방지를 위한 선택적 disabled 속성 |
| `scripts/test-charm.cjs`, `package.json` | 자동 테스트와 `test:charm` 실행 항목 |

기존 `storage.ts`의 구버전 전송 대기열은 삭제하지 않았다. 계정/시리얼 근거가 없어 새 대기열로 자동 이전하지 않는다. 업데이트 이후 기기에 다시 연결해 전체 SYNC를 수행한다. 기기에서 이미 사라지고 구버전 앱에만 남은 기록의 복구는 별도 확인이 필요하다.

## 6. 서버와 합의가 필요한 계약

1. `GET /api/v1/devices/connection-policy`의 `allowedServiceUuids`에 위 NUS Service UUID가 있어야 한다. 서버가 `8A100000...`만 허용하거나 빈 목록을 주면 설정 오류를 표시한다. 주변 BLE 진단 검색은 가능하지만 연결/등록은 차단한다. 정책 API 자체 조회 실패일 때만 코드의 NUS 기본값을 사용한다. 이름 검색으로 등록 정책을 우회하지 않는다.
2. `POST /api/v1/devices` 및 목록 조회 응답의 `serialNumber`가 `ID` 응답과 정확히 일치해야 한다. 기기 등록 요청의 `macAddress`는 연결용 BLE 식별값일 뿐 제품의 영구 ID가 아니다.
3. `POST /api/v1/devices/{id}/sensor-readings/batch`는 `(기기, sequence)` 중복 요청을 안전하게 처리해야 한다. 응답이 사라졌을 때 재업로드될 수 있다.
4. ACK는 해당 기기에 실제 저장 완료된 누적 구간을 의미해야 한다. 프론트는 요청한 업로드 데이터로 그 구간을 재검증한다.
5. `ackSequence`는 정수이다. `{ "success": true, "data": { "ackSequence": 150 } }` 또는 `{ "ackSequence": 150 }`을 지원한다. 빈 성공 응답은 ACK 근거가 아니다.
6. 시각 0/누락 번호를 처리하는 서버 정책은 이 작업에서 추가하지 않았다.

기존 서버 DTO의 필드명을 유지했다: `sequenceNumber`, `temperature`, `humidity`, `maxShockLevel`, `motionCount`, `isOuting`, `measuredAt`.
기존 호환용 `isOuting: false`는 외출 여부를 측정/판단한 결과가 아니다. Backend에서 판단해야 하며 추후 DTO에서 제거하거나 미상 표현을 합의해야 한다.
`measuredAt`은 기존 코드처럼 **휴대폰 현지 시각의 offset 없는 문자열**로 전송한다. 해외/시간대 변경까지 정확히 보장하려면 서버와 UTC/offset 계약을 정해야 한다. 이번 BLE 변경에서 임의로 API 형식을 바꾸지 않았다.

## 7. 실행 준비

1. 프론트 프로젝트 폴더에서 Node 24 LTS를 사용한다. 검증은 Node 24.19.0 기준이다.
2. `npm ci`로 현재 lockfile의 의존성을 설치한다.
3. 개발 환경에 실제 서버 주소 `EXPO_PUBLIC_API_BASE_URL`을 설정한다. `/api/v1`은 코드가 붙이므로 중복하지 않는다. 이 작업은 인증 토큰이나 운영 환경 파일을 만들지 않았다.
4. 개발용 Android 빌드에 `react-native-ble-plx`가 포함되어야 한다. Expo Go에서는 BLE 테스트가 안 된다.
5. Android SDK/개발 환경이 있는 PC에서 USB 디버깅을 허용한 실물폰을 연결한 뒤 `npm run android`를 실행한다. 기존 호환 개발 빌드가 설치돼 있으면 `npm run start`로 Metro를 시작해 연결한다.
6. 실제 서버가 HTTP라면 Android 빌드의 cleartext 네트워크 정책도 확인한다. 여기서는 보안 설정을 완화하지 않았다. BLE 수신 성공과 서버 네트워크 접근 성공은 별개다.
7. nRF Connect/다른 터미널 앱의 참 연결은 해제한다. 테스트 앱과 동시에 같은 참을 점유하지 않는다.

## 8. 실물 검증 순서

자동 테스트와 구분하여, 아래 결과는 실제 실행 후 기록한다. 정상 ACK 시험은 미저장/시각 미상 과거 구간이 없는 전용 테스트 데이터로 진행한다. 실제 사용 기록을 지워서 조건을 만들지 않는다.

| 순서 | 실행 | 확인할 결과 |
| --- | --- | --- |
| 1 | 시리얼 모니터를 9600 baud로 열고 `PROFILE` + Newline 전송 | `PROFILE,SMARTCHARM_UART,1,LEGACY_GATT=0` |
| 2 | USB에서 `ID`, `STATUS`를 각각 전송 | 실제 시리얼, pending/latest/lastAck/dropped 기록 |
| 3 | nRF Connect에서 광고와 서비스를 확인 | 위 Service UUID 광고 및 정확한 Write/Notify UUID |
| 4 | nRF Connect 연결을 해제하고 개발 앱 로그인 | 동일 참을 다른 앱이 점유하지 않음 |
| 5 | 참 검색 실행, Bluetooth 권한 허용 | NUS UUID 후보만 표시. 정책 오류면 서버 허용 UUID부터 확인 |
| 6 | 참 선택 | 앱 로그에서 BLE 연결, 서비스 검색, UART 구독, PING/PROFILE/ID 순서 확인 |
| 7 | 같은 시점 시리얼 모니터 확인 | `PING`, `PROFILE`, `ID`, `TIME ...`, `STATUS`, `SYNC` 명령 수신 |
| 8 | 전체 수신 완료 대기 | 앱의 `SYNC verified` count가 SYNC 시작 개수와 같음. 고정 시간 만료로 성공하지 않음 |
| 9 | 서버 기기 등록 확인 | 반환 시리얼이 `SC-OB-...`와 일치. 등록 실패가 BLE 연결 실패로 표시되지 않음 |
| 10 | 제품 선택/연결 후 센서 업로드 확인 | 요청에 유효 시각 기록 전체가 포함. 시간 0은 제외되고 휴대폰에 보관 |
| 11 | 정상 서버 `ackSequence` 응답 확인 | 이후에만 시리얼에 `ACK <번호>`가 나타남 |
| 12 | ACK 완료 및 상태 확인 | `ACK,ACCEPTED,...` 뒤 ready STATUS의 lastAck 일치. 이미 처리했으면 IGNORED + 상태 확인 |
| 13 | 제품 연결이 완료된 기기 화면 열기 | 센서 동기화 버튼, 배터리 미지원. 환경값은 서버의 마지막 저장 결과 |
| 14 | TIME 설정된 상태로 30~60초 기록한 후 동기화 | 현재 한 개뿐 아니라 누적 기록 수신. 테스트 주기 10초/최대20개 이내 |
| 15 | 인터넷만 끄고 Bluetooth는 켠 채 동기화 | 서버 업로드 실패 표시, 기기 ACK 없음. 받은 기록은 보관 |
| 16 | 인터넷 복구 후 센서 동기화 재시도 | 기존/새 기록 병합 업로드. 중복 저장은 서버가 방지 |
| 17 | ACK 직전/직후 BLE를 끊었다가 재연결 | 휴대폰의 보류 ACK 확인 후 재전송. 다른 시리얼에는 쓰지 않음 |
| 18 | 앱 강제 종료 후 다시 실행, 기기 화면에서 동기화 | 같은 계정의 대기열 복원. 주소로 재연결 불가하면 참 추가에서 다시 검색 |
| 19 | 시간 0 또는 누락 구간이 있는 데이터로 시험 | 경고 표시 및 누적 ACK 보류. 데이터를 가짜 시각으로 바꾸지 않음 |
| 20 | 로그아웃 후 다른 계정으로 전환 | 이전 BLE 세션 종료, 이전 계정의 대기열 업로드/ACK 금지 |

정상 ACK 뒤에도 새 기록이 생기면 pending이 다시 늘어날 수 있다. 단순히 숫자가 0인지 대신 **lastAck와 남아 있는 sequence 범위**를 비교한다. `SYNC_END`나 BLE Write 성공 자체는 서버 저장 증명이 아니다.

## 9. 자동 검증 결과

| 검사 | 결과 |
| --- | --- |
| `npm run typecheck` | 통과 |
| `npm run test:charm` | 47개 통과 |
| `npx expo export --platform android` | Android Hermes JavaScript 번들 및 에셋 생성 통과 |
| `git diff --check` | 통과 |
| `npx expo install --check` 온라인 조회 | 기존 패키지 2개 패치 버전 권고. 버전은 변경하지 않음 |
| 실물 Bluetooth, Android APK 실행, 서버 실제 저장 | 미검증 |

테스트는 실제 생산 코드의 순수 프로토콜/세션/대기열/업로드 흐름을 불러오고 BLE, HTTP, 휴대폰 저장소만 대체한다. 실제 펌웨어 로그 `R,150,0,2480,4500,10,0,1FFE`를 CRC 기준으로 사용한다.

47개에는 분할/병합 Notify, 잘못된 CRC/숫자, 20개 SYNC, STATUS와 수신 개수 대조, 누락/중복/충돌, 명령 순서, BUSY, 응답/Write 정지, 끊김, 저장 실패, 다른 계정/기기, HTTP 응답 형식, 시간 0, 미래 ACK, 앱 재시작 뒤 보류 ACK 복구가 포함된다. 검색 보완 6개는 광고 UUID 없는 후보 검색 및 실제 GATT 검증, 서버 정책 차단 유지, Bluetooth 초기 상태 대기/오류/타임아웃을 검증한다.

Expo 권고: 현재 `expo@54.0.36` -> `~54.0.37`, `expo-constants@18.0.13` -> `~18.0.14`. 이는 기존 lockfile 조합에 대한 권고이며 BLE 변경 과정에서 의존성을 일괄 갱신하지 않았다. Android 번들 성공은 APK 빌드 또는 실물 BLE 성공을 뜻하지 않는다.

## 10. 이번 범위 밖

- 백그라운드/종료 상태 자동 동기화, 무한 재시도, iOS 실물 검증.
- 기기 배터리 회로, 펌웨어 센서/EEPROM 구현 변경.
- 서버의 시각 미상/누락 기록 승인 정책, 중복 저장 방지 구현.
- 기기별 시리얼 발급 시스템, 암호학적 인증, 암호화 저장.
- 가죽 손상/외출/케어 필요 여부를 프론트나 기기에서 판단하는 기능.
