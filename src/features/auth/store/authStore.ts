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
  signInWithKakao: (accessToken: string) => Promise<void>;
  restoreSession: () => Promise<boolean>;
  signOut: () => Promise<void>;
};

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
    const tokens: AuthTokens = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      tokenType: response.tokenType,
    };
    await saveTokens(tokens);

    // 계정이 바뀌었을 수 있으니 이전 사용자의 쿼리 캐시를 먼저 버립니다.
    resetQueryCache();

    set({
      accessToken: tokens.accessToken,
      refreshTokenValue: tokens.refreshToken,
      tokenType: tokens.tokenType,
      user: response.user,
      status: "authenticated",
    });
  },

  signInWithKakao: async () => {
    throw new Error("카카오 로그인은 현재 비활성화되어 있습니다.");
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
      const tokens: AuthTokens = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        tokenType: response.tokenType,
      };
      await saveTokens(tokens);

      set({
        accessToken: tokens.accessToken,
        refreshTokenValue: tokens.refreshToken,
        tokenType: tokens.tokenType,
        user: response.user,
        status: "authenticated",
      });

      return true;
    } catch {
      await removeTokens();
      resetQueryCache();
      set({
        accessToken: null,
        refreshTokenValue: null,
        tokenType: "Bearer",
        user: null,
        status: "guest",
      });

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

    set({
      accessToken: null,
      refreshTokenValue: null,
      tokenType: "Bearer",
      user: null,
      status: "guest",
    });
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
      const tokens: AuthTokens = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        tokenType: response.tokenType,
      };
      await saveTokens(tokens);

      useAuthStore.setState({
        accessToken: tokens.accessToken,
        refreshTokenValue: tokens.refreshToken,
        tokenType: tokens.tokenType,
        user: response.user,
        status: "authenticated",
      });

      return tokens.accessToken;
    } catch {
      return null;
    }
  },
  clear: async () => {
    await removeTokens();

    resetQueryCache();

    useAuthStore.setState({
      accessToken: null,
      refreshTokenValue: null,
      tokenType: "Bearer",
      user: null,
      status: "guest",
    });
  },
});
