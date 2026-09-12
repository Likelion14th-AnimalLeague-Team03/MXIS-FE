import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import { login, logout, refreshToken } from "@/features/auth/api/authApi";
import type { AuthTokens, LoginRequest, UserProfile } from "@/features/auth/types";
import { registerAuthSession } from "@/shared/api/authSession";
import { resetQueryCache } from "@/shared/api/queryClient";

const AUTH_TOKENS_KEY = "mxis.auth.tokens";

type AuthStatus = "idle" | "checking" | "authenticated" | "guest";

type AuthState = {
  accessToken: string | null;
  refreshTokenValue: string | null;
  tokenType: string;
  user: UserProfile | null;
  status: AuthStatus;
  signIn: (request: LoginRequest) => Promise<void>;
  restoreSession: () => Promise<boolean>;
  signOut: () => Promise<void>;
};

type AuthSessionState = Pick<
  AuthState,
  "accessToken" | "refreshTokenValue" | "tokenType" | "user" | "status"
>;

const GUEST_AUTH_STATE: AuthSessionState = {
  accessToken: null,
  refreshTokenValue: null,
  tokenType: "Bearer",
  user: null,
  status: "guest",
};

function toAuthTokens(response: AuthTokens): AuthTokens {
  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    tokenType: response.tokenType,
  };
}

function toAuthenticatedState(
  tokens: AuthTokens,
  user: UserProfile,
): AuthSessionState {
  return {
    accessToken: tokens.accessToken,
    refreshTokenValue: tokens.refreshToken,
    tokenType: tokens.tokenType,
    user,
    status: "authenticated",
  };
}

async function saveTokens(tokens: AuthTokens) {
  await AsyncStorage.setItem(AUTH_TOKENS_KEY, JSON.stringify(tokens));
}

async function readTokens() {
  const value = await AsyncStorage.getItem(AUTH_TOKENS_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as AuthTokens;
  } catch {
    await AsyncStorage.removeItem(AUTH_TOKENS_KEY);
    return null;
  }
}

async function removeTokens() {
  await AsyncStorage.removeItem(AUTH_TOKENS_KEY);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshTokenValue: null,
  tokenType: "Bearer",
  user: null,
  status: "idle",

  signIn: async (request) => {
    const response = await login(request);
    const tokens = toAuthTokens(response);
    await saveTokens(tokens);

    // 계정이 바뀌었을 수 있으니 이전 사용자의 쿼리 캐시를 먼저 버립니다.
    resetQueryCache();

    set(toAuthenticatedState(tokens, response.user));
  },

  restoreSession: async () => {
    set({ status: "checking" });

    const storedTokens = await readTokens();

    if (!storedTokens?.refreshToken) {
      set({ status: "guest" });
      return false;
    }

    try {
      const response = await refreshToken(storedTokens.refreshToken);
      const tokens = toAuthTokens(response);
      await saveTokens(tokens);

      set(toAuthenticatedState(tokens, response.user));

      return true;
    } catch {
      await removeTokens();
      resetQueryCache();
      set(GUEST_AUTH_STATE);

      return false;
    }
  },

  signOut: async () => {
    const { accessToken } = get();

    if (accessToken) {
      await logout();
    }

    await removeTokens();

    resetQueryCache();

    set(GUEST_AUTH_STATE);
  },
}));

// axios 인터셉터가 토큰을 스스로 붙이고, 401이면 재발급까지 하도록 스토어 동작을 등록해요.
registerAuthSession({
  getAccessToken: () => useAuthStore.getState().accessToken,
  getTokenType: () => useAuthStore.getState().tokenType,
  refresh: async () => {
    const stored =
      useAuthStore.getState().refreshTokenValue ?? (await readTokens())?.refreshToken;

    if (!stored) {
      return null;
    }

    try {
      const response = await refreshToken(stored);
      const tokens = toAuthTokens(response);
      await saveTokens(tokens);

      useAuthStore.setState(toAuthenticatedState(tokens, response.user));

      return tokens.accessToken;
    } catch {
      return null;
    }
  },
  clear: async () => {
    await removeTokens();

    resetQueryCache();

    useAuthStore.setState(GUEST_AUTH_STATE);
  },
});
