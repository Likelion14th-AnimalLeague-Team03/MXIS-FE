import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { SecondaryButton } from "@/shared/components/SecondaryButton";

export function ForgotPasswordScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-concierge-bg">
      <StatusBar style="dark" backgroundColor="#FAF6F1" />
      <View className="flex-1 px-6 pb-8 pt-6">
        <ScreenHeader title="비밀번호 찾기" onBack={() => router.back()} />

        <View className="flex-1 justify-center">
          <Text
            className="text-center text-[20px] font-bold text-concierge-text"
            style={{ letterSpacing: -0.5 }}
          >
            준비 중인 기능입니다.
          </Text>
          <Text
            className="mt-3 text-center text-[14px] font-medium text-concierge-textSecondary"
            style={{ letterSpacing: -0.35, lineHeight: 20 }}
          >
            비밀번호 재설정 API가 확정되면 이곳에서 계정 확인을 도와드릴게요.
          </Text>
        </View>

        <SecondaryButton label="로그인으로 돌아가기" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}
