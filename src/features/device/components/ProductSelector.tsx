import { Image, Pressable, Text, View } from "react-native";

import heroBackground from "@/shared/assets/care-device-hero.png";
import type { DeviceProduct } from "@/features/device/types";

type ProductSelectorProps = {
  products: DeviceProduct[];
  selectedProduct: DeviceProduct | null;
  onMoveProduct: (direction: "prev" | "next") => void;
  onSelectProduct: (productId: number) => void;
};

export function ProductSelector({
  products,
  selectedProduct,
  onMoveProduct,
  onSelectProduct,
}: ProductSelectorProps) {
  return (
    <View className="mt-[18px] flex-row items-center justify-between px-5">
      <Pressable onPress={() => onMoveProduct("prev")} hitSlop={12}>
        <Text className="text-[34px] font-light text-[#111111]">‹</Text>
      </Pressable>

      <View className="flex-1 items-center">
        <View className="flex-row items-center justify-center gap-[20px]">
          {products.map((product) => {
            const selected = product.id === selectedProduct?.id;
            return (
              <Pressable
                key={product.id}
                onPress={() => onSelectProduct(product.id)}
              >
                <View
                  className="h-20 w-20 items-center justify-center"
                  style={{
                    borderRadius: 40,
                    borderWidth: 1,
                    borderColor: selected ? "#E4AB7C" : "transparent",
                  }}
                >
                  {product.image ? (
                    <Image
                      source={product.image}
                      resizeMode="contain"
                      style={{ height: 55, width: 55 }}
                    />
                  ) : (
                    <Text className="text-[11px] font-medium text-[#898989]">
                      이미지 없음
                    </Text>
                  )}
                </View>
                <View
                  className="mt-[2px] h-[3px] w-[22px] self-center rounded-full"
                  style={{
                    backgroundColor: selected ? "#E4AB7C" : "transparent",
                  }}
                />
              </Pressable>
            );
          })}
        </View>
        <Text className="mt-1 text-[14px] font-medium text-[#6B6B6B]">
          좌우로 넘겨 가방을 선택하세요
        </Text>
      </View>

      <Pressable onPress={() => onMoveProduct("next")} hitSlop={12}>
        <Text className="text-[34px] font-light text-[#111111]">›</Text>
      </Pressable>
    </View>
  );
}

export function ProductHero({ product }: { product: DeviceProduct | null }) {
  return (
    <View
      className="mt-[10px] overflow-hidden self-center"
      style={{ height: 220.43, width: 388 }}
    >
      <Image
        source={heroBackground}
        style={{ height: 220.43, width: 388 }}
        resizeMode="cover"
      />
      <View className="absolute inset-0 mt-12 items-center">
        {product?.image ? (
          <Image
            source={product.image}
            resizeMode="contain"
            style={{ height: 178, width: 316 }}
          />
        ) : (
          <View className="h-[178px] w-[316px] items-center justify-center">
            <Text className="text-[13px] font-medium text-[#898989]">
              제품 이미지가 없습니다.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
