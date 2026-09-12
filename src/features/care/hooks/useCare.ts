import { useQuery } from "@tanstack/react-query";

import {
  getCareDiagnosisHome,
  getCareEnvironmentOverview,
  getCareGuide,
  getCareReport,
} from "@/features/care/api/careApi";
import { careQueryKeys } from "@/features/care/queryKeys";

const CARE_STALE_TIME = 60 * 1000;

export function useCareDiagnosisHome(productId: number | null) {
  return useQuery({
    queryKey: careQueryKeys.diagnosisHome(productId),
    queryFn: () => getCareDiagnosisHome(productId as number),
    enabled: productId !== null,
    staleTime: CARE_STALE_TIME,
  });
}

export function useCareReport(productId: number | null) {
  return useQuery({
    queryKey: careQueryKeys.report(productId),
    queryFn: () => getCareReport(productId as number),
    enabled: productId !== null,
    staleTime: CARE_STALE_TIME,
  });
}

export function useCareEnvironmentOverview(productId: number | null) {
  return useQuery({
    queryKey: careQueryKeys.environmentOverview(productId),
    queryFn: () => getCareEnvironmentOverview(productId as number),
    enabled: productId !== null,
    staleTime: CARE_STALE_TIME,
  });
}

export function useCareGuide(productId: number | null) {
  return useQuery({
    queryKey: careQueryKeys.guide(productId),
    queryFn: () => getCareGuide(productId as number),
    enabled: productId !== null,
    staleTime: 5 * 60 * 1000,
  });
}
