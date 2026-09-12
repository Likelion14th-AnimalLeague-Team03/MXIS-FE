import { Image, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useDeviceStore } from "@/features/device/store";
import charmOnboardingDevice from "@/features/onboarding/assets/charm-onboarding-device.png";
import {
  CharmDeviceCard,
  SearchBottomActions,
} from "@/features/onboarding/components/CharmScanResults";
import { useCharmScanController } from "@/features/onboarding/hooks/useCharmScanController";
import { ScreenHeader } from "@/shared/components/ScreenHeader";

export function CharmScanScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const accessToken = useAuthStore((state) => state.accessToken);
  const tokenType = useAuthStore((state) => state.tokenType);
  const ownerId = useAuthStore((state) => String(state.user?.id ?? ""));
  const addOwnedCharm = useDeviceStore((state) => state.addOwnedCharm);
  const {
    connectDevice,
    devices,
    errorMessage,
    hasEmptyResult,
    isConnecting,
    policyReady,
    scanResult,
    startScan,
  } = useCharmScanController({
    accessToken,
    ownerId,
    tokenType,
    onConnected: (device, registeredDeviceId, registeredSerialNumber) => {
      const deviceId = String(registeredDeviceId);
      const deviceSerial = registeredSerialNumber || device.serialNumber;

      if (returnTo === "device") {
        addOwnedCharm(deviceId);
        router.replace({
          pathname: "/onboarding/charm-connected",
          params: {
            returnTo: "device",
            deviceId,
            deviceSerial,
          },
        });
        return;
      }

      router.replace({
        pathname: "/onboarding/charm-connected",
        params: { deviceId, deviceSerial },
      });
    },
  });

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-concierge-bg">
      <StatusBar style="dark" backgroundColor="#FAF6F1" />
      <View className="flex-1 px-6 pb-6 pt-6">
        <View className="flex-1">
          <ScreenHeader
            title="MXIS Charm을 찾고 있어요."
            titleClassName="text-2xl"
            onBack={() => router.back()}
          />
          <Text className="mt-2 text-sm font-medium text-concierge-textSecondary">
            스마트폰 가까이에 두고 잠시만 기다려 주세요.
          </Text>

          <View className="h-[286px] items-center justify-center">
            <Image
              source={charmOnboardingDevice}
              className="h-[286px] w-[286px]"
              resizeMode="contain"
            />
          </View>

          <ScrollView className="flex-1" contentContainerClassName="pb-4">
            {errorMessage ? (
              <Text
                accessibilityLiveRegion="polite"
                className="mb-2 text-center text-xs font-medium text-[#C04737]"
              >
                {errorMessage}
              </Text>
            ) : null}
            {hasEmptyResult ? (
              <View className="items-center py-4">
                <Text className="text-center text-base font-bold text-concierge-primary">
                  {errorMessage
                    ? "검색을 완료하지 못했어요"
                    : "연결 가능한 참을 찾을 수 없어요"}
                </Text>
                {!errorMessage ? (
                  <Text className="mt-1.5 text-center text-sm font-semibold text-concierge-textSecondary">
                    Charm의 전원이 켜져 있는지 확인해 주세요
                  </Text>
                ) : null}
              </View>
            ) : null}
            {scanResult === "scanning" && devices.length === 0 ? (
              <Text className="py-4 text-center text-sm text-concierge-textSecondary">
                {!policyReady
                  ? "검색 준비 중"
                  : "가까운 MXIS Charm을 검색하고 있습니다."}
              </Text>
            ) : null}
            {devices.length > 0 ? (
              <View className="overflow-hidden rounded-[10px] bg-white">
                {devices.map((device, index) => (
                  <CharmDeviceCard
                    key={device.id}
                    device={device}
                    onPress={connectDevice}
                    disabled={isConnecting}
                    isLast={index === devices.length - 1}
                  />
                ))}
              </View>
            ) : null}
          </ScrollView>
        </View>

        <SearchBottomActions
          onSearchAgain={() => {
            void startScan();
          }}
          disabled={!policyReady || isConnecting}
        />
      </View>
    </SafeAreaView>
  );
}
