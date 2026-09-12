import { useRouter } from "expo-router";
import { ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CareConditionSummary } from "@/features/care/components/CareConditionSummary";
import { CareEnvironmentSummary } from "@/features/care/components/CareEnvironmentSummary";
import { CareProductCard } from "@/features/care/components/CareProductCard";
import { useCareDiagnosisHome } from "@/features/care/hooks/useCare";
import { useCurrentProduct } from "@/features/product/hooks/useProduct";
import { PrimaryButton } from "@/shared/components/PrimaryButton";

export function CareHomeScreen() {
  const router = useRouter();
  const {
    product: currentProduct,
    productId,
    isAuthenticated,
    isPending: isProductPending,
    hasNoProduct,
    error: productError,
  } = useCurrentProduct();
  const {
    data: diagnosis,
    isPending: isDiagnosisPending,
    error,
  } = useCareDiagnosisHome(productId);

  const isPending =
    isProductPending || (productId !== null && isDiagnosisPending);
  const diagnosisProduct = diagnosis?.product;
  const product =
    diagnosisProduct || currentProduct
      ? {
          productImageUrl:
            diagnosisProduct?.productImageUrl ??
            currentProduct?.productImageUrl ??
            null,
          productName:
            diagnosisProduct?.productName ?? currentProduct?.productName ?? null,
          materialDisplayName:
            diagnosisProduct?.materialDisplayName ??
            currentProduct?.materialDisplayName ??
            null,
          color: diagnosisProduct?.color ?? currentProduct?.color ?? null,
        }
      : null;
  const environment = diagnosis?.environment30d;
  const hasData =
    environment?.avgTemperature != null || environment?.avgHumidity != null;
  const blockedReason = !isAuthenticated
    ? "로그인이 필요해요. 다시 로그인해 주세요."
    : hasNoProduct
      ? "등록된 제품이 없어요. 제품을 먼저 등록해 주세요."
      : (productError?.message ?? error?.message ?? null);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView className="flex-1 px-6" contentContainerClassName="pb-28">
        <Text className="pt-6 text-xl font-bold text-concierge-text">
          케어진단
        </Text>

        <CareProductCard
          color={product?.color}
          isPending={isPending}
          materialDisplayName={product?.materialDisplayName}
          outingCount={diagnosis?.totalOutingCount}
          productImageUrl={product?.productImageUrl}
          productName={product?.productName}
        />
        <CareConditionSummary
          description={diagnosis?.condition?.description}
          onOpenReport={() => router.push("/care/report")}
          summary={diagnosis?.condition?.summary}
        />

        {blockedReason ? (
          <Text className="mt-3 text-xs text-[#C04737]">{blockedReason}</Text>
        ) : null}

        <CareEnvironmentSummary
          environment={environment}
          hasData={hasData}
          onOpen={() => router.push("/care/environment")}
        />

        <PrimaryButton
          className="mt-6"
          label="관리 가이드 보기"
          onPress={() => router.push("/care/guide")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
