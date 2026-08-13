export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer" | string;
};

export type ApiErrorBody = {
  code: string;
  message: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: ApiErrorBody | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type SignupRequest = {
  email: string;
  password: string;
  name: string;
  phone?: string;
};

export type SignupResponse = {
  userId: number;
  email: string;
  name: string;
};

export type KakaoLoginRequest = {
  accessToken: string;
};

export type KakaoProfileDraft = {
  accessToken: string;
  name: string;
  email: string;
  phone: string;
};
