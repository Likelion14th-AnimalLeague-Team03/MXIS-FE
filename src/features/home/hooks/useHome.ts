import { useQuery } from "@tanstack/react-query";

import { getHomeSummary } from "@/features/home/api/homeApi";

export const homeQueryKeys = {
  summary: (productId: number | null) => ["home", "summary", productId] as const,
};

export function useHomeSummary(productId: number | null) {
  return useQuery({
    queryKey: homeQueryKeys.summary(productId),
    queryFn: () => getHomeSummary(productId as number),
    enabled: productId !== null,
    staleTime: 60 * 1000,
  });
}
