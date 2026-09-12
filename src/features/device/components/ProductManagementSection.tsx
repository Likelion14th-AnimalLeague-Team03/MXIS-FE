import { Pressable, Text, View } from "react-native";

import { Pill } from "@/features/device/components/DeviceBadges";
import type {
  DeviceManagementSummary,
  ProductDeviceManagementSummary,
} from "@/features/device/types";
import type { DeviceProduct } from "@/features/device/types";
import {
  formatMaterialColor,
  formatOutingCount,
} from "@/features/device/utils/deviceDisplay";

type ProductManagementSectionProps = {
  product: DeviceProduct | null;
  productSummary: ProductDeviceManagementSummary | null;
  primarySummary?: DeviceManagementSummary | null;
  isMainProduct: boolean;
  isSetPrimaryPending: boolean;
  onSetPrimaryProduct: () => void;
};

export function ProductManagementSection({
  product,
  productSummary,
  primarySummary,
  isMainProduct,
  isSetPrimaryPending,
  onSetPrimaryProduct,
}: ProductManagementSectionProps) {
  return (
    <>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <Text
            className="text-[13px] font-semibold text-[#171717]"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            allowFontScaling={false}
          >
            {product?.productName ?? "등록된 제품이 없습니다."}
          </Text>
          <Text
            className="mt-[2px] text-[13px] font-medium text-[#6B6B6B]"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.78}
            allowFontScaling={false}
          >
            {product ? formatMaterialColor(product) : "-"}
          </Text>
          <Text className="mt-[2px] text-[13px] font-medium text-[#232323]">
            함께한 외출{" "}
            <Text className="text-[#814C27]">
              {formatOutingCount(product, productSummary, primarySummary)}
            </Text>
          </Text>
        </View>
        {isMainProduct ? <Pill label="현재 메인" /> : null}
      </View>

      <Pressable
        onPress={onSetPrimaryProduct}
        disabled={isMainProduct || !product || isSetPrimaryPending}
        className={`mt-[18px] h-[48px] items-center justify-center rounded-[10px] ${
          isMainProduct ? "bg-[rgba(195,195,195,0.6)]" : "bg-[#814C27]"
        }`}
      >
        <Text
          className={`text-[14px] font-medium ${
            isMainProduct ? "text-[#898989]" : "text-white"
          }`}
        >
          {isMainProduct ? "현재 선택된 가방입니다." : "메인 가방으로 확정"}
        </Text>
      </Pressable>
    </>
  );
}
