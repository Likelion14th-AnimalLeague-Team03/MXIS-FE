import type { ImageSourcePropType } from "react-native";

import ellaBostonThumbnail from "@/features/onboarding/assets/products/bag1.png";
import starkBackpackThumbnail from "@/features/onboarding/assets/products/bag2.png";
import himmelShopperThumbnail from "@/features/onboarding/assets/products/bag3.png";

export type OnboardingProduct = {
  id: string;
  productId: number;
  name: string;
  material: string;
  color: string;
  productCode: string;
  modelCode?: string;
  productImageUrl?: string | null;
  thumbnail: ImageSourcePropType;
  detailImage: ImageSourcePropType;
};

export const MOCK_ONBOARDING_PRODUCTS: OnboardingProduct[] = [
  {
    id: "ella-boston",
    productId: 1,
    name: "Ella  바세토스 보스턴 백",
    material: "Visetos Canvas",
    color: "Cognac",
    productCode: "MWBFAEA01CO001",
    thumbnail: ellaBostonThumbnail,
    detailImage: ellaBostonThumbnail,
  },
  {
    id: "stark-backpack",
    productId: 2,
    name: "Stark 사이드 스터드\n비세토스 백팩",
    material: "Visetos Canvas",
    color: "Black",
    productCode: "MWBFAEA01BK001",
    thumbnail: starkBackpackThumbnail,
    detailImage: starkBackpackThumbnail,
  },
  {
    id: "himmel-shopper",
    productId: 3,
    name: "MCM Himmel Shopper",
    material: "Lauretos Canvas",
    color: "Oatmeal",
    productCode: "MWPESAC01OT001",
    thumbnail: himmelShopperThumbnail,
    detailImage: himmelShopperThumbnail,
  },
];

export function getOnboardingProductById(productId?: string | string[]) {
  const normalizedProductId = Array.isArray(productId)
    ? productId[0]
    : productId;

  return (
    MOCK_ONBOARDING_PRODUCTS.find(
      (product) => product.id === normalizedProductId,
    ) ?? MOCK_ONBOARDING_PRODUCTS[0]
  );
}
