/** OpenAPI: ProductResponse */
export type Product = {
  id: number;
  dppCode?: string | null;
  productName: string;
  modelCode?: string | null;
  materialId?: string | null;
  materialDisplayName?: string | null;
  materialSubtypes?: string[] | null;
  color?: string | null;
  productImageUrl?: string | null;
  purchasedAt?: string | null;
  registeredAt?: string | null;
  isPrimary?: boolean;
};
