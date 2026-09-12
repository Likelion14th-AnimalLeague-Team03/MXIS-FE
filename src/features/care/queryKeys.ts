export const careQueryKeys = {
  all: ["care"] as const,
  diagnosisHome: (productId: number | null) =>
    ["care", "diagnosis-home", productId] as const,
  report: (productId: number | null) => ["care", "report", productId] as const,
  environmentOverview: (productId: number | null) =>
    ["care", "environment-overview", productId] as const,
  guide: (productId: number | null) => ["care", "guide", productId] as const,
};
