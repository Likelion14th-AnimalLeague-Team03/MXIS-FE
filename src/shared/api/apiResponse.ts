import { AxiosError } from "axios";

/** 서버 공통 응답 래퍼 (OpenAPI: ApiResponse*) */
export type ApiErrorBody = {
  code: string;
  message: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T | null;
  error?: ApiErrorBody | null;
};

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as ApiResponse<unknown> | undefined;
    return responseData?.error?.message ?? fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

/**
 * success/data/error 래퍼를 벗겨서 data만 돌려줘요.
 * data가 null일 수도 있는(예: 활성 제안 없음) 응답은 unwrapNullableApiData를 쓰세요.
 */
export function unwrapApiData<T>(response: ApiResponse<T>, fallbackMessage: string) {
  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error?.message ?? fallbackMessage);
}

export function unwrapNullableApiData<T>(
  response: ApiResponse<T>,
  fallbackMessage: string,
) {
  if (response.success) {
    return response.data ?? null;
  }

  throw new Error(response.error?.message ?? fallbackMessage);
}

/** API 호출을 감싸서 실패 시 한국어 메시지를 가진 Error로 통일해요. */
export async function withApiError<T>(
  request: () => Promise<T>,
  fallbackMessage: string,
) {
  try {
    return await request();
  } catch (error) {
    throw new Error(getApiErrorMessage(error, fallbackMessage));
  }
}
