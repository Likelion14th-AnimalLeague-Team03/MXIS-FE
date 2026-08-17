export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer" | string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type SignupRequest = {
  email: string;
  password: string;
  name: string;
  phone?: string;
};

export type KakaoProfileDraft = {
  accessToken: string;
  name: string;
  email: string;
  phone: string;
};
