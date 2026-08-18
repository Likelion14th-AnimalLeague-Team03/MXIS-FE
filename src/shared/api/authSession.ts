/**
 * authStore와 axios 인터셉터를 잇는 다리 역할이에요.
 * client.ts가 authStore를 직접 import하면 순환 참조(store -> api -> client -> store)가 생기니
 * 앱 시작 시 authStore가 자기 동작을 여기에 등록해두고, 인터셉터는 이 모듈만 바라봅니다.
 */
export type AuthSessionBridge = {
  getAccessToken: () => string | null;
  getTokenType: () => string;
  /** 토큰 재발급 성공 시 새 accessToken, 실패 시 null */
  refresh: () => Promise<string | null>;
  /** 재발급까지 실패해서 세션을 버려야 할 때 */
  clear: () => Promise<void> | void;
};

let bridge: AuthSessionBridge | null = null;

export function registerAuthSession(next: AuthSessionBridge) {
  bridge = next;
}

export function getAuthSession() {
  return bridge;
}
