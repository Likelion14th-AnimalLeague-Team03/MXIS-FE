import type { Product } from "@/features/product/types";
import {
  type ApiResponse,
  unwrapNullableApiData,
  withApiError,
} from "@/shared/api/apiResponse";
import { apiClient } from "@/shared/api/client";

/** GET /products/primary — 등록된 대표 제품이 없으면 null */
export async function getPrimaryProduct() {
  return withApiError(async () => {
    const response = await apiClient.get<ApiResponse<Product>>("/products/primary");

    return unwrapNullableApiData(response.data, "대표 제품을 불러오지 못했습니다.");
  }, "대표 제품 정보를 불러오는 데 실패했습니다.");
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
