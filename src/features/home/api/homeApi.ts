import type { HomeSummary } from "@/features/home/types";
import { type ApiResponse, unwrapApiData, withApiError } from "@/shared/api/apiResponse";
import { apiClient } from "@/shared/api/client";

/** GET /products/{id}/home */
export async function getHomeSummary(productId: number) {
  return withApiError(async () => {
    const response = await apiClient.get<ApiResponse<HomeSummary>>(
      `/products/${productId}/home`,
    );

    return unwrapApiData(response.data, "홈 정보를 불러오지 못했습니다.");
  }, "홈 정보를 불러오는 데 실패했습니다.");
}
