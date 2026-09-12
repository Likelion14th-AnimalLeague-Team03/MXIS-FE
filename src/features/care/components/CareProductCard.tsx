import { Image, Text, View } from "react-native";

import defaultProductImage from "@/features/care/assets/bag3.png";
import { CARE_CARD_SHADOW } from "@/features/care/styles";
import { Card } from "@/shared/components/Card";
import careHeroBackground from "@/shared/assets/care-device-hero.png";

function getTextValue(value: string | null | undefined, fallback: string) {
  return value?.trim() || fallback;
}

export function CareProductCard({
  color,
  isPending,
  materialDisplayName,
  outingCount,
  productImageUrl,
  productName,
}: {
  color?: string | null;
  isPending: boolean;
  materialDisplayName?: string | null;
  outingCount?: number | null;
  productImageUrl?: string | null;
  productName?: string | null;
}) {
  return (
    <Card
      className="mt-4 flex-row items-center gap-4 overflow-hidden border-1 border-concierge-primary bg-white p-0"
      style={CARE_CARD_SHADOW}
    >
      <View className="h-[108px] w-[45%] overflow-hidden">
        <Image source={careHeroBackground} className="size-full" resizeMode="cover" />
        <View className="absolute inset-0 items-center justify-center">
          <Image
            source={productImageUrl ? { uri: productImageUrl } : defaultProductImage}
            className="mt-5 size-[180px]"
            resizeMode="contain"
          />
        </View>
      </View>

      <View className="min-w-0 flex-1 pr-3">
        <Text
          className="text-base font-bold text-concierge-text"
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.78}
          allowFontScaling={false}
        >
          {getTextValue(
            productName,
            isPending ? "불러오는 중" : "등록된 제품 없음",
          )}
        </Text>
        <Text
          className="mt-1 text-[11px] text-concierge-textMuted"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          allowFontScaling={false}
        >
          {[materialDisplayName?.trim(), color?.trim()]
            .filter(Boolean)
            .join(" · ") || "-"}
        </Text>
        <Text className="mt-2 text-xs font-medium text-concierge-text">
          함께한 외출 {outingCount != null ? `${outingCount}회` : "-회"}
        </Text>
      </View>
    </Card>
  );
}
