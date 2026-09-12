export const deviceQueryKeys = {
  all: ["device"] as const,
  summary: ["device", "summary"] as const,
  products: ["device", "products"] as const,
  devices: ["device", "devices"] as const,
  productDevices: (productId: number | null) =>
    ["device", "product-devices", productId] as const,
  productSummary: (productId: number | null) =>
    ["device", "product-summary", productId] as const,
};
