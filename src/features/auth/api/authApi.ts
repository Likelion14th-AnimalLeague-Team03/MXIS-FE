import { AxiosError } from "axios";

import { apiClient } from "@/shared/api/client";
import type {
  ApiResponse,
  AuthTokens,
  KakaoLoginRequest,
  LoginRequest,
  RefreshRequest,
  SignupRequest,
  SignupResponse,
} from "@/features/auth/types";

export class AuthApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "AuthApiError";
    this.code = code;
  }
}

function getApiMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<ApiResponse<unknown>>;

  return axiosError.response?.data?.error?.message ?? fallback;
}

function getApiCode(error: unknown) {
  const axiosError = error as AxiosError<ApiResponse<unknown>>;

  return axiosError.response?.data?.error?.code;
}

function unwrapResponse<T>(response: ApiResponse<T>, fallback: string) {
  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? fallback);
  }

  return response.data;
}

export async function login(request: LoginRequest) {
  try {
    const { data } = await apiClient.post<ApiResponse<AuthTokens>>(
      "/api/v1/auth/login",
      request,
    );

    return unwrapResponse(data, "로그인 정보를 다시 확인해 주세요.");
  } catch (error) {
    throw new AuthApiError(
      getApiMessage(error, "로그인에 실패했습니다."),
      getApiCode(error),
    );
  }
}

export async function refreshToken(request: RefreshRequest) {
  try {
    const { data } = await apiClient.post<ApiResponse<AuthTokens>>(
      "/api/v1/auth/refresh",
      request,
    );

    return unwrapResponse(data, "다시 로그인해 주세요.");
  } catch (error) {
    throw new AuthApiError(
      getApiMessage(error, "다시 로그인해 주세요."),
      getApiCode(error),
    );
  }
}

export async function logout(accessToken: string) {
  try {
    await apiClient.post<ApiResponse<void>>(
      "/api/v1/auth/logout",
      undefined,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  } catch {
    // Stateless JWT logout is completed by deleting local tokens.
  }
}

export async function signup(request: SignupRequest) {
  try {
    const { data } = await apiClient.post<ApiResponse<SignupResponse>>(
      "/api/v1/auth/signup",
      request,
    );

    return unwrapResponse(data, "입력하신 정보를 다시 확인해 주세요.");
  } catch (error) {
    throw new AuthApiError(
      getApiMessage(error, "회원가입에 실패했습니다."),
      getApiCode(error),
    );
  }
}

export async function loginWithKakao(request: KakaoLoginRequest) {
  try {
    const { data } = await apiClient.post<ApiResponse<AuthTokens>>(
      "/api/v1/auth/kakao/login",
      request,
    );

    return unwrapResponse(data, "카카오 로그인 정보를 다시 확인해 주세요.");
  } catch (error) {
    throw new AuthApiError(
      getApiMessage(error, "카카오 로그인에 실패했습니다."),
      getApiCode(error),
    );
  }
}
