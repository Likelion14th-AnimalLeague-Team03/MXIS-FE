import { AxiosError } from "axios";

import type { AuthTokens, LoginRequest, UserProfile } from "@/features/auth/types";
import { apiClient } from "@/shared/api/client";

type ApiErrorBody = {
  code: string;
  message: string;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T | null;
  error?: ApiErrorBody | null;
};

export type TokenResponse = AuthTokens & {
  user: UserProfile;
};

function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as ApiResponse<unknown> | undefined;
    return responseData?.error?.message ?? fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

function unwrapApiData<T>(response: ApiResponse<T>, fallbackMessage: string) {
  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error?.message ?? fallbackMessage);
}

export async function login(request: LoginRequest) {
  try {
    const response = await apiClient.post<ApiResponse<TokenResponse>>(
      "/api/v1/auth/login",
      request,
    );

    return unwrapApiData(response.data, "로그인에 실패했습니다.");
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "아이디 또는 비밀번호를 다시 확인해 주세요."),
    );
  }
}

export async function refreshToken(refreshToken: string) {
  try {
    const response = await apiClient.post<ApiResponse<TokenResponse>>(
      "/api/v1/auth/refresh",
      { refreshToken },
    );

    return unwrapApiData(response.data, "세션 갱신에 실패했습니다.");
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "다시 로그인해 주세요."));
  }
}

export async function logout(accessToken: string, tokenType = "Bearer") {
  try {
    await apiClient.post<ApiResponse<void>>(
      "/api/v1/auth/logout",
      undefined,
      {
        headers: {
          Authorization: `${tokenType} ${accessToken}`,
        },
      },
    );
  } catch {
    // 서버가 Stateless JWT 구조라 로그아웃의 핵심 처리는 클라이언트 토큰 폐기입니다.
  }
}
