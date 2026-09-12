export const homeQueryKeys = {
  all: ["home"] as const,
  summary: (productId: number | null) =>
    ["home", "summary", productId] as const,
};
