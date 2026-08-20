import type { AuthTokens, LoginRequest, UserProfile } from "@/features/auth/types";
import {
  type ApiResponse,
  unwrapApiData,
  withApiError,
} from "@/shared/api/apiResponse";
import { apiClient } from "@/shared/api/client";

/** OpenAPI: TokenResponse */
export type TokenResponse = AuthTokens & {
  user: UserProfile;
};

/** POST /auth/login */
export async function login(request: LoginRequest) {
  return withApiError(async () => {
    const response = await apiClient.post<ApiResponse<TokenResponse>>(
      "/auth/login",
      request,
    );

    return unwrapApiData(response.data, "로그인에 실패했습니다.");
  }, "아이디 또는 비밀번호를 다시 확인해 주세요.");
}

/** POST /auth/refresh */
export async function refreshToken(refreshToken: string) {
  return withApiError(async () => {
    const response = await apiClient.post<ApiResponse<TokenResponse>>(
      "/auth/refresh",
      { refreshToken },
    );

    return unwrapApiData(response.data, "세션 갱신에 실패했습니다.");
  }, "다시 로그인해 주세요.");
}

/** POST /auth/logout */
export async function logout() {
  try {
    await apiClient.post<ApiResponse<void>>("/auth/logout");
  } catch {
    // 서버가 Stateless JWT 구조라 로그아웃의 핵심 처리는 클라이언트 토큰 폐기입니다.
  }
}
