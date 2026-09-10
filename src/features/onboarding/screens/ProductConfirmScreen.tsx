import { useRef, useState } from "react";
import { Image, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/authStore";
import {
  linkProductDevice,
} from "@/features/onboarding/api/onboardingApi";
import {
  savePrimaryCharmProductLink,
} from "@/features/onboarding/storage";
import { uploadAndAcknowledgeSmartCharm } from "@/features/onboarding/ble/smartCharmSync";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { SecondaryButton } from "@/shared/components/SecondaryButton";

function ProductInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <Text className="text-sm font-semibold text-concierge-textSecondary">
        {label}
      </Text>
      <Text
        className="flex-1 text-right text-sm font-semibold text-concierge-text"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.78}
        allowFontScaling={false}
      >
        {value || "-"}
      </Text>
    </View>
  );
}

export function ProductConfirmScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    color = "",
    deviceId = "",
    deviceSerial = "",
    material = "",
    productCode = "",
    productId = "",
    productImageUrl = "",
    productName = "",
  } = useLocalSearchParams<{
    color?: string;
    deviceId?: string;
    deviceSerial?: string;
    material?: string;
    productCode?: string;
    productId?: string;
    productImageUrl?: string;
    productName?: string;
  }>();
  const accessToken = useAuthStore((state) => state.accessToken);
  const tokenType = useAuthStore((state) => state.tokenType);
  const ownerId = useAuthStore((state) => String(state.user?.id ?? ""));
  const numericProductId = Number(productId);
  const numericDeviceId = Number(deviceId);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canContinue, setCanContinue] = useState(false);
  const submittingRef = useRef(false);
  const linkedRef = useRef<{ key: string; serial: string } | null>(null);
  const linkKey = `${ownerId}:${productId}:${deviceId}:${deviceSerial}`;

  const finishRegistration = async () => {
    if (linkedRef.current?.key !== linkKey) return;
    const auth = useAuthStore.getState();
    if (!auth.accessToken || String(auth.user?.id ?? "") !== ownerId) throw new Error("로그인 계정이 변경되었습니다.");
    await savePrimaryCharmProductLink({
      charmName: linkedRef.current.serial, productId: String(numericProductId),
      productName, material, color, productCode, linkedAt: new Date().toISOString(),
    });
    router.push({
      pathname: "/onboarding/notification-permission",
      params: { productId: String(numericProductId), deviceId: String(numericDeviceId), deviceSerial: linkedRef.current.serial },
    });
  };

  const handleConfirmProduct = async () => {
    if (submittingRef.current) return;
    if (!accessToken || !ownerId) {
      setErrorMessage(
        "로그인 정보가 없어 제품과 Charm을 연결할 수 없습니다.",
      );
      return;
    }

    if (
      !Number.isSafeInteger(numericProductId) || numericProductId <= 0 ||
      !Number.isSafeInteger(numericDeviceId) || numericDeviceId <= 0 ||
      !deviceSerial
    ) {
      setErrorMessage(
        "제품 또는 Charm 정보를 확인할 수 없습니다. 다시 연결해 주세요.",
      );
      return;
    }

    try {
      submittingRef.current = true;
      setIsSubmitting(true);
      setErrorMessage("");

      if (linkedRef.current?.key !== linkKey) {
        const linkedDevice = await linkProductDevice(numericProductId, numericDeviceId, accessToken, tokenType);
        if (linkedDevice.serialNumber !== deviceSerial) throw new Error("제품에 연결된 참 ID가 실제 참과 다릅니다.");
        linkedRef.current = { key: linkKey, serial: linkedDevice.serialNumber };
      }
      setCanContinue(true);
      const result = await uploadAndAcknowledgeSmartCharm(ownerId, deviceSerial, numericDeviceId);
      await queryClient.invalidateQueries({ queryKey: ["device"] });
      await queryClient.invalidateQueries({ queryKey: ["home"] });
      await queryClient.invalidateQueries({ queryKey: ["care"] });
      if (!result.complete) {
        setErrorMessage(`제품 연결은 완료되었습니다. ${result.message}`);
        return;
      }
      await finishRegistration();
    } catch (error) {
      setErrorMessage(
        `${linkedRef.current?.key === linkKey ? "제품 연결은 완료되었습니다. 센서 동기화 대기: " : "제품 연결 실패: "}${error instanceof Error ? error.message : "다시 시도해 주세요."}`,
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-concierge-bg">
      <StatusBar style="dark" backgroundColor="#FAF6F1" />

      <View className="mx-auto w-full max-w-[390px] flex-1 px-6 pb-6 pt-6">
        <View className="flex-1">
          <ScreenHeader
            title="연결할 제품을 확인해 주세요."
            titleClassName="text-[22px]"
            onBack={() => router.back()}
          />

          <View className="mt-6 h-[170px] items-center justify-center">
            {productImageUrl ? (
              <Image
                source={{ uri: productImageUrl }}
                resizeMode="contain"
                style={{ height: 170, width: 222 }}
              />
            ) : (
              <View className="h-[150px] w-[222px] items-center justify-center rounded-xl bg-white">
                <Text className="text-sm text-concierge-textMuted">
                  이미지 없음
                </Text>
              </View>
            )}
          </View>

          <View className="mt-6 rounded-xl border border-concierge-border bg-white px-4 py-3.5">
            <Text
              className="text-[13px] font-semibold text-concierge-text"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
              allowFontScaling={false}
            >
              {productName || "-"}
            </Text>

            <View className="mt-2 gap-2">
              <ProductInfoRow label="소재" value={material} />
              <ProductInfoRow label="색상" value={color} />
              <ProductInfoRow label="제품 코드" value={productCode} />
            </View>
          </View>
        </View>

        <View className="gap-2">
          {errorMessage ? (
            <Text className="text-center text-xs font-medium text-[#C04737]">
              {errorMessage}
            </Text>
          ) : null}
          <PrimaryButton
            label={isSubmitting ? "동기화 중입니다" : canContinue ? "센서 동기화 다시 시도" : "네, 이 제품과 연결할게요"}
            onPress={handleConfirmProduct}
            disabled={isSubmitting}
          />
          {canContinue && !isSubmitting ? (
            <SecondaryButton label="동기화는 나중에 하고 등록 계속" onPress={() => {
              void finishRegistration().catch((error) => setErrorMessage(error instanceof Error ? error.message : "등록 상태를 저장하지 못했습니다."));
            }} />
          ) : null}
          <SecondaryButton
            label="다른 제품 선택"
            onPress={() => router.back()}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
