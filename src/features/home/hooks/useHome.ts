import { useQuery } from "@tanstack/react-query";

import { getHomeSummary } from "@/features/home/api/homeApi";
import type { HomeSummary } from "@/features/home/types";

export const homeQueryKeys = {
  summary: (productId: number | null) =>
    ["home", "summary", productId] as const,
};

const TEMP_CONNECTED_HOME_SUMMARY: HomeSummary = {
  userName: "김준규",
  productImageUrl: null,
  productState: "NORMAL",
  score: 100,
  headline: "안정적인 상태입니다.",
  daysTogether: 1,
  upcomingReservation: null,
  charmNeedsReconnect: false,
};

export function useHomeSummary(productId: number | null) {
  return useQuery({
    queryKey: homeQueryKeys.summary(productId),
    queryFn: () => getHomeSummary(productId as number),
    enabled: productId !== null,
    placeholderData:
      productId === null ? TEMP_CONNECTED_HOME_SUMMARY : undefined,
    staleTime: 60 * 1000,
  });
}
