import { AxiosError } from "axios";

import type { Product } from "@/features/product/types";
import {
  type ApiResponse,
  getApiErrorMessage,
  unwrapNullableApiData,
  withApiError,
} from "@/shared/api/apiResponse";
import { apiClient } from "@/shared/api/client";

/** GET /products/primary — 등록된 대표 제품이 없으면 null */
export async function getPrimaryProduct() {
  try {
    const response = await apiClient.get<ApiResponse<Product>>("/products/primary");

    return unwrapNullableApiData(response.data, "대표 제품을 불러오지 못했습니다.");
  } catch (error) {
    // 대표 제품이 지정되지 않은 계정은 404로 응답할 수 있어서 "없음"으로 처리해요.
    // (여기서 throw하면 productId를 못 구해 홈·케어·예약이 전부 빈 화면이 됩니다.)
    if (error instanceof AxiosError && error.response?.status === 404) {
      return null;
    }

    throw new Error(
      getApiErrorMessage(error, "대표 제품 정보를 불러오는 데 실패했습니다."),
    );
  }
}

/** GET /products */
export async function getProducts() {
  return withApiError(async () => {
    const response = await apiClient.get<ApiResponse<Product[]>>("/products");

    return (
      unwrapNullableApiData(response.data, "제품 목록을 불러오지 못했습니다.") ?? []
    );
  }, "제품 목록을 불러오는 데 실패했습니다.");
}
