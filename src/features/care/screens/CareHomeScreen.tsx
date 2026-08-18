import { useRouter } from "expo-router";
import { type ReactNode } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import careHeroBg from "@/features/care/assets/care-hero.png";
import outIcon from "@/features/care/assets/out.png";
import popIcon from "@/features/care/assets/pop.png";
import temperatureIcon from "@/features/care/assets/temperature.png";
import waterIcon from "@/features/care/assets/water.png";
import { useCareDiagnosisHome } from "@/features/care/hooks/useCare";
import { PRODUCTS } from "@/features/device/constants";
import { usePrimaryProductId } from "@/features/product/hooks/useProduct";
import { Card } from "@/shared/components/Card";
import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";

function StatCard({
  icon,
  label,
  caption,
  value,
  muted = false,
}: {
  icon: ReactNode;
  label: string;
  caption?: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <Card className="w-[47%] border-0 bg-white px-3 py-3">
      <View className="flex-row items-start gap-1.5">
        {icon}
        <View>
          <Text className="text-base font-semibold text-concierge-text">
            {label}
          </Text>
          {caption ? (
            <Text className="mt-0.5 text-[8px] text-concierge-textMuted">
              {caption}
            </Text>
          ) : null}
          <Text
            className={
              muted
                ? "mt-3 text-base font-semibold text-concierge-accentMuted"
                : "mt-3 text-2xl font-bold text-concierge-text"
            }
          >
            {value}
          </Text>
        </View>
      </View>
    </Card>
  );
}

export function CareHomeScreen() {
  const router = useRouter();
  const { productId } = usePrimaryProductId();
  const { data: diagnosis, isPending, error } = useCareDiagnosisHome(productId);

  const product = diagnosis?.product;
  const environment = diagnosis?.environment30d;
  // 환경 30일 요약이 비어 있으면 아직 데이터가 모이는 중으로 봐요.
  const hasData = environment?.avgTemperature != null || environment?.avgHumidity != null;
  const fallbackImage = PRODUCTS[0].image;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView className="flex-1 px-6" contentContainerClassName="pb-8">
        <Text className="pt-6 text-xl font-bold text-concierge-text">
          케어진단
        </Text>

        <Card className="mt-4 flex-row items-center gap-4 overflow-hidden border-concierge-borderLight bg-white p-0">
          <View className="h-[171px] w-[45%] overflow-hidden">
            <Image
              source={careHeroBg}
              className="size-full"
              resizeMode="cover"
            />
            <View className="absolute inset-0 items-center justify-center ">
              <Image
                source={
                  product?.productImageUrl
                    ? { uri: product.productImageUrl }
                    : fallbackImage
                }
                className="size-[250px] "
                resizeMode="contain"
              />
            </View>
          </View>
          <View className="flex-1 pr-3">
            <Text className="text-base font-bold text-concierge-text">
              {product?.productName ?? (isPending ? "불러오는 중" : "등록된 제품 없음")}
            </Text>
            <Text className="mt-1 text-[11px] text-concierge-textMuted">
              {[product?.materialDisplayName, product?.color]
                .filter(Boolean)
                .join(" · ") || "-"}
            </Text>
            <Text className="mt-2 text-xs font-medium text-concierge-text">
              함께한 외출{" "}
              {diagnosis?.totalOutingCount != null
                ? `${diagnosis.totalOutingCount}회`
                : "-회"}
            </Text>
          </View>
        </Card>

        <Card className="mt-4 border-0 bg-white px-3.5 py-3.5">
          <Text className="text-xs text-concierge-textMuted">현재 컨디션</Text>
          <Text className="mt-1 text-lg font-bold text-concierge-text">
            {diagnosis?.condition?.summary ?? "데이터가 수집되고 있습니다."}
          </Text>
          <Text className="mt-1 text-[11px] text-concierge-textMuted">
            {diagnosis?.condition?.description ??
              "정확한 진단을 위해 환경 데이터를 모으고 있어요."}
          </Text>
          <Pressable
            onPress={() => router.push("/care/report")}
            className="mt-2 flex-row items-center justify-end gap-1"
          >
            <Text className="text-[11px] font-medium text-concierge-text">
              상태 리포트 보기
            </Text>
            <ChevronRightIcon size={5} />
          </Pressable>
        </Card>

        <Card className="mt-3 border-0 bg-white px-3.5 py-6">
          <Text className="text-sm font-semibold text-concierge-text">
            지금 추천하는 관리를 확인해보세요.
          </Text>
          <Pressable
            onPress={() => router.push("/care/guide")}
            className="mt-2 flex-row items-center justify-end gap-1"
          >
            <Text className="text-[11px] font-medium text-concierge-text">
              관리 가이드 가기
            </Text>
            <ChevronRightIcon size={5} />
          </Pressable>
        </Card>

        {error ? (
          <Text className="mt-3 text-xs text-[#C04737]">{error.message}</Text>
        ) : null}

        <Pressable
          onPress={() => router.push("/care/environment")}
          className="mt-6 mx-2 flex-row items-center justify-between"
        >
          <View>
            <Text className="text-2xl font-semibold text-concierge-text">
              환경 요약
            </Text>
            <Text className="mt-1 text-[13px] text-concierge-textMuted">
              {hasData
                ? "최근 30일 동안의 평균이에요."
                : "데이터가 충분히 쌓이면 확인할 수 있어요."}
            </Text>
          </View>
          <ChevronRightIcon size={9} />
        </Pressable>

        <View className="mt-3 flex-row flex-wrap justify-between gap-y-3">
          <StatCard
            icon={
              <Image
                source={temperatureIcon}
                className="size-[18px] mt-1.5 "
                resizeMode="contain"
              />
            }
            label="온도"
            caption={environment?.temperatureDescription ?? undefined}
            value={
              environment?.avgTemperature != null
                ? `${Math.round(environment.avgTemperature)}°C`
                : "-°C"
            }
            muted={environment?.avgTemperature == null}
          />
          <StatCard
            icon={
              <Image
                source={waterIcon}
                className="size-[18px] mt-1.5"
                resizeMode="contain"
              />
            }
            label="습도"
            caption={environment?.humidityDescription ?? undefined}
            value={
              environment?.avgHumidity != null
                ? `${Math.round(environment.avgHumidity)} %`
                : "- %"
            }
            muted={environment?.avgHumidity == null}
          />
          <StatCard
            icon={
              <Image
                source={popIcon}
                className="size-[18px] mt-1.5 "
                resizeMode="contain"
              />
            }
            label="충격"
            value={environment?.shockLevelLabel ?? "수집중"}
            muted={!environment?.shockLevelLabel}
          />
          <StatCard
            icon={
              <Image
                source={outIcon}
                className="size-[18px] mt-1.5"
                resizeMode="contain"
              />
            }
            label="최근 이동"
            value={
              environment?.outingCount != null
                ? `${environment.outingCount}회`
                : "수집중"
            }
            muted={environment?.outingCount == null}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
