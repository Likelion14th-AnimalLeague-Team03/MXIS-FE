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
    if (!error.response) {
      // 응답 자체가 없으면 네트워크·타임아웃 문제예요.
      return error.code === "ECONNABORTED"
        ? "서버 응답이 지연되고 있어요. 잠시 후 다시 시도해 주세요."
        : "네트워크 연결을 확인해 주세요.";
    }

    const responseData = error.response.data as
      | (ApiResponse<unknown> & { message?: unknown })
      | undefined;

    // 우리 서버 규약(error.message) → Spring 기본 에러 본문(message) 순으로 찾아요.
    if (responseData?.error?.message) {
      return responseData.error.message;
    }

    if (typeof responseData?.message === "string" && responseData.message) {
      return responseData.message;
    }

    return fallbackMessage;
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
