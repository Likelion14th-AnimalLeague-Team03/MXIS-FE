import type { ImageSourcePropType } from "react-native";

import ellaBostonDetail from "@/features/onboarding/assets/products/ella-boston-detail.png";
import ellaBostonThumbnail from "@/features/onboarding/assets/products/ella-boston-thumbnail.png";
import himmelShopperThumbnail from "@/features/onboarding/assets/products/himmel-shopper-thumbnail.png";
import starkBackpackThumbnail from "@/features/onboarding/assets/products/stark-backpack-thumbnail.png";

export type OnboardingProduct = {
  id: string;
  name: string;
  material: string;
  color: string;
  productCode: string;
  thumbnail: ImageSourcePropType;
  detailImage: ImageSourcePropType;
};

export const MOCK_ONBOARDING_PRODUCTS: OnboardingProduct[] = [
  {
    id: "ella-boston",
    name: "Ella  바세토스 보스턴 백",
    material: "Visetos Canvas",
    color: "Cognac",
    productCode: "MWBFAEA01CO001",
    thumbnail: ellaBostonThumbnail,
    detailImage: ellaBostonDetail,
  },
  {
    id: "stark-backpack",
    name: "Stark 사이드 스터드\n비세토스 백팩",
    material: "Visetos Canvas",
    color: "Black",
    productCode: "MWBFAEA01BK001",
    thumbnail: starkBackpackThumbnail,
    detailImage: starkBackpackThumbnail,
  },
  {
    id: "himmel-shopper",
    name: "MCM Himmel Shopper",
    material: "Lauretos Canvas",
    color: "Oatmeal",
    productCode: "MWPESAC01OT001",
    thumbnail: himmelShopperThumbnail,
    detailImage: himmelShopperThumbnail,
  },
];

export function getOnboardingProductById(productId?: string | string[]) {
  const normalizedProductId = Array.isArray(productId) ? productId[0] : productId;

  return (
    MOCK_ONBOARDING_PRODUCTS.find((product) => product.id === normalizedProductId) ??
    MOCK_ONBOARDING_PRODUCTS[0]
  );
}
