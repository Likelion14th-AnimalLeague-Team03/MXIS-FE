import type {
  CareDiagnosisHome,
  CareEnvironmentOverview,
  CareGuide,
  CareReportScreen,
} from "@/features/care/types";
import { type ApiResponse, unwrapApiData, withApiError } from "@/shared/api/apiResponse";
import { apiClient } from "@/shared/api/client";

/** GET /care/products/{productId}/diagnosis-home */
export async function getCareDiagnosisHome(productId: number) {
  return withApiError(async () => {
    const response = await apiClient.get<ApiResponse<CareDiagnosisHome>>(
      `/care/products/${productId}/diagnosis-home`,
    );

    return unwrapApiData(response.data, "케어 진단 정보를 불러오지 못했습니다.");
  }, "케어 진단 정보를 불러오는 데 실패했습니다.");
}

/** GET /care/products/{productId}/report */
export async function getCareReport(productId: number) {
  return withApiError(async () => {
    const response = await apiClient.get<ApiResponse<CareReportScreen>>(
      `/care/products/${productId}/report`,
    );

    return unwrapApiData(response.data, "상태 리포트를 불러오지 못했습니다.");
  }, "상태 리포트를 불러오는 데 실패했습니다.");
}

/** GET /care/products/{productId}/environment/overview */
export async function getCareEnvironmentOverview(productId: number) {
  return withApiError(async () => {
    const response = await apiClient.get<ApiResponse<CareEnvironmentOverview>>(
      `/care/products/${productId}/environment/overview`,
    );

    return unwrapApiData(response.data, "환경 데이터를 불러오지 못했습니다.");
  }, "환경 데이터를 불러오는 데 실패했습니다.");
}

/** GET /care/products/{productId}/guide */
export async function getCareGuide(productId: number) {
  return withApiError(async () => {
    const response = await apiClient.get<ApiResponse<CareGuide>>(
      `/care/products/${productId}/guide`,
    );

    return unwrapApiData(response.data, "관리 가이드를 불러오지 못했습니다.");
  }, "관리 가이드를 불러오는 데 실패했습니다.");
}
