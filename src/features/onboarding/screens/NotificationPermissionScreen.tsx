import { Image, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import notificationPermissionBag from "@/features/onboarding/assets/products/notification-permission-bag.png";
import { ensureNotificationPermission } from "@/shared/notifications/notificationPermission";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { SecondaryButton } from "@/shared/components/SecondaryButton";
import { ScreenHeader } from "@/shared/components/ScreenHeader";

export function NotificationPermissionScreen() {
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId?: string }>();

  const goNext = () => {
    router.push({
      pathname: "/onboarding/registration-complete",
      params: productId ? { productId } : undefined,
    });
  };

  const requestNotificationPermission = async () => {
    // 여기서 거부해도 온보딩은 계속 진행하고, 마이페이지에서 다시 물어볼 수 있어요.
    await ensureNotificationPermission();

    goNext();
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-concierge-bg">
      <StatusBar style="dark" backgroundColor="#FAF6F1" />

      <View className="mx-auto w-full max-w-[390px] flex-1 px-6 pb-6 pt-6">
        <View className="flex-1">
          <ScreenHeader title="알림 권한" onBack={() => router.back()} />

          <Text className="mt-5 text-sm text-concierge-textSecondary">
            제품의 변화부터 케어 일정까지,{"\n"}필요한 순간을 놓치지 않도록 알려드릴게요.
          </Text>

          <View className="mt-6 h-[220px] items-center justify-center">
            <Image
              source={notificationPermissionBag}
              resizeMode="contain"
              style={{ height: 220, width: 220 }}
            />
          </View>

          <View className="rounded-xl border border-concierge-border bg-concierge-surfaceMuted px-4 py-3">
            <Text className="text-sm font-semibold text-concierge-text">
              필요한 순간, MXIS가 알려드려요
            </Text>
            <Text className="mt-2 text-sm text-concierge-textSecondary">
              · 케어 시점 안내{"\n"}· 예약 리마인드{"\n"}· MXIS Charm 연결·배터리 안내{"\n"}· 환경 변화 감지
            </Text>
          </View>
        </View>

        <View>
          <Text className="mb-3 text-center text-xs text-concierge-textMuted">
            알림 설정은 마이페이지에서 언제든 변경할 수 있습니다.
          </Text>
          <View className="gap-2">
            <PrimaryButton label="알림 받기" onPress={requestNotificationPermission} />
            <SecondaryButton label="나중에" onPress={goNext} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
