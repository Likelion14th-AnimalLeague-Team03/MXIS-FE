import { useEffect } from "react";
import { Image, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

import mxisLogo from "@/features/splash/assets/mxis-logo.png";
import { useAuthStore } from "@/features/auth/store/authStore";
import { getAuthenticatedEntryRoute } from "@/features/onboarding/storage";

const SPLASH_DURATION_MS = 1600;

export function SplashScreen() {
  const router = useRouter();
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const isAuthenticated = await restoreSession();
      const nextRoute = isAuthenticated
        ? await getAuthenticatedEntryRoute()
        : "/auth/login";

      router.replace(nextRoute);
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, [restoreSession, router]);

  return (
    <View className="flex-1 bg-concierge-bg">
      <StatusBar style="dark" backgroundColor="#FAF6F1" />

      <View className="absolute left-0 right-0 top-0 bottom-0 items-center justify-center">
        <View className="items-center">
          <Image
            source={mxisLogo}
            className="h-[57px] w-[184px]"
            resizeMode="contain"
          />
          <Text
            className="mt-[19px] text-center text-[12px] font-medium text-concierge-textSecondary"
            style={{ letterSpacing: -0.06, lineHeight: 17 }}
          >
            MXIS · PRODUCT CARE JOURNEY
          </Text>
        </View>
      </View>

      <Text
        className="absolute bottom-[54px] left-0 right-0 text-center text-[14px] font-medium text-[#898989]"
        style={{ letterSpacing: -0.35, lineHeight: 20 }}
      >
        제품과 함께하는 시간을 케어합니다
      </Text>
    </View>
  );
}
