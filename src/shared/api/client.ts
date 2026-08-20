import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import { getAuthSession } from "@/shared/api/authSession";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

/** 모든 엔드포인트가 공유하는 접두사 — 각 API 함수는 이 뒤의 경로만 적어요. */
export const API_PREFIX = "/api/v1";

if (!API_BASE_URL) {
  console.warn("EXPO_PUBLIC_API_BASE_URL is not set.");
}

export const apiClient = axios.create({
  // 환경변수에 슬래시가 붙어 있어도 "//api/v1"이 되지 않게 정리해요.
  baseURL: `${API_BASE_URL?.replace(/\/+$/, "") ?? ""}${API_PREFIX}`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

/** 토큰이 필요 없는 경로 */
const TOKEN_FREE_PATHS = ["/auth/login", "/auth/refresh"];

/** 401이 떠도 토큰 재발급을 시도하지 않을 경로 (재발급 자체가 실패한 경우 등) */
const REFRESH_FREE_PATHS = [...TOKEN_FREE_PATHS, "/auth/logout"];

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

function matchesPath(paths: string[], url?: string) {
  if (!url) {
    return false;
  }

  return paths.some((path) => url.includes(path));
}

apiClient.interceptors.request.use((config) => {
  if (
    matchesPath(TOKEN_FREE_PATHS, config.url) ||
    config.headers.Authorization
  ) {
    return config;
  }

  const session = getAuthSession();
  const accessToken = session?.getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `${session?.getTokenType() ?? "Bearer"} ${accessToken}`;
  }

  return config;
});

// 401이 동시에 여러 개 터져도 재발급은 한 번만 하도록 진행 중인 Promise를 공유해요.
let refreshPromise: Promise<string | null> | null = null;

async function refreshOnce(refresh: () => Promise<string | null>) {
  if (!refreshPromise) {
    refreshPromise = refresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const session = getAuthSession();

    if (
      error.response?.status !== 401 ||
      !config ||
      config._retried ||
      matchesPath(REFRESH_FREE_PATHS, config.url) ||
      !session
    ) {
      throw error;
    }

    config._retried = true;

    const accessToken = await refreshOnce(session.refresh);

    if (!accessToken) {
      await session.clear();
      throw error;
    }

    config.headers.Authorization = `${session.getTokenType()} ${accessToken}`;

    return apiClient.request(config as AxiosRequestConfig);
  },
);
