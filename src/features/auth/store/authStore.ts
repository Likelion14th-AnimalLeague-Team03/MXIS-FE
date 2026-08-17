import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import type { AuthTokens, LoginRequest } from "@/features/auth/types";

const AUTH_TOKENS_KEY = "mxis.auth.tokens";
const MOCK_LOGIN_ID = "1234";
const MOCK_LOGIN_PASSWORD = "1234";

type AuthStatus = "idle" | "checking" | "authenticated" | "guest";

type AuthState = {
  accessToken: string | null;
  refreshTokenValue: string | null;
  tokenType: string;
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

function isMockLogin(request: LoginRequest) {
  return (
    request.email === MOCK_LOGIN_ID && request.password === MOCK_LOGIN_PASSWORD
  );
}

function createMockTokens(): AuthTokens {
  return {
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
    tokenType: "Bearer",
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshTokenValue: null,
  tokenType: "Bearer",
  status: "idle",

  signIn: async (request) => {
    if (!isMockLogin(request)) {
      throw new Error("아이디 또는 비밀번호를 다시 확인해 주세요.");
    }

    const tokens = createMockTokens();
    await saveTokens(tokens);

    set({
      accessToken: tokens.accessToken,
      refreshTokenValue: tokens.refreshToken,
      tokenType: tokens.tokenType,
      status: "authenticated",
    });
  },

  signInWithKakao: async () => {
    const tokens = createMockTokens();
    await saveTokens(tokens);

    set({
      accessToken: tokens.accessToken,
      refreshTokenValue: tokens.refreshToken,
      tokenType: tokens.tokenType,
      status: "authenticated",
    });
  },

  restoreSession: async () => {
    set({ status: "checking" });

    const storedTokens = await readTokens();

    if (!storedTokens?.refreshToken) {
      set({ status: "guest" });
      return false;
    }

    set({
      accessToken: storedTokens.accessToken,
      refreshTokenValue: storedTokens.refreshToken,
      tokenType: storedTokens.tokenType,
      status: "authenticated",
    });

    return true;
  },

  signOut: async () => {
    await removeTokens();

    set({
      accessToken: null,
      refreshTokenValue: null,
      tokenType: "Bearer",
      status: "guest",
    });
  },
}));
