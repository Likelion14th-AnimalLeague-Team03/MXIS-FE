import { Image, PermissionsAndroid, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import notificationPermissionBag from "@/features/onboarding/assets/products/notification-permission-bag.png";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { SecondaryButton } from "@/shared/components/SecondaryButton";
import { BackChevronIcon } from "@/shared/components/icons/BackChevronIcon";

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
    if (Platform.OS === "android" && Platform.Version >= 33) {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }

    goNext();
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-concierge-bg">
      <StatusBar style="dark" backgroundColor="#FAF6F1" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mx-auto min-h-full w-full max-w-[390px] px-6 pb-7 pt-[72px]">
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => router.back()} hitSlop={12} className="h-7 w-3 justify-center">
              <BackChevronIcon size={8} color="#111111" />
            </Pressable>
            <Text
              className="text-[20px] font-bold text-[#121212]"
              style={{ letterSpacing: -0.5, lineHeight: 28 }}
            >
              알림 권한
            </Text>
          </View>

          <Text
            className="mt-[20px] text-[14px] font-medium text-[#63635E]"
            style={{ letterSpacing: -0.35, lineHeight: 20 }}
          >
            제품의 변화부터 케어 일정까지,{"\n"}필요한 순간을 놓치지 않도록 알려드릴게요.
          </Text>

          <View className="mt-[38px] h-[255px] items-center justify-center">
            <Image
              source={notificationPermissionBag}
              resizeMode="contain"
              style={{ height: 255, width: 255 }}
            />
          </View>

          <View className="mt-[7px] rounded-[12px] border border-[#DBDBD6] bg-[#F2EBE5] px-4 py-3">
            <Text
              className="text-[14px] font-semibold text-[#121212]"
              style={{ letterSpacing: -0.35, lineHeight: 20 }}
            >
              필요한 순간, MXIS가 알려드려요
            </Text>
            <Text
              className="mt-[7px] text-[14px] font-medium text-[#63635E]"
              style={{ letterSpacing: -0.35, lineHeight: 20 }}
            >
              · 케어 시점 안내{"\n"}· 예약 리마인드{"\n"}· MXIS Charm 연결·배터리 안내{"\n"}· 환경 변화 감지
            </Text>
          </View>

          <View className="mt-auto pt-[66px]">
            <Text
              className="mb-[13px] text-center text-[12px] font-medium text-[#898989]"
              style={{ letterSpacing: -0.12, lineHeight: 17 }}
            >
              알림 설정은 마이페이지에서 언제든 변경할 수 있습니다.
            </Text>
            <View className="gap-[9px]">
              <PrimaryButton
                label="알림 받기"
                onPress={requestNotificationPermission}
                className="h-[52px] rounded-[10px]"
              />
              <SecondaryButton label="나중에" onPress={goNext} className="h-[52px] rounded-[10px]" />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
