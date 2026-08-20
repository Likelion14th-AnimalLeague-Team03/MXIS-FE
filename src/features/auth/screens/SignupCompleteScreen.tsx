import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

import { CheckmarkCircleIcon } from "@/shared/components/icons/CheckmarkCircleIcon";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { ScreenHeader } from "@/shared/components/ScreenHeader";

export function SignupCompleteScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-concierge-bg">
      <StatusBar style="dark" backgroundColor="#FAF6F1" />
      <View className="flex-1 px-6 pb-7 pt-6">
        <ScreenHeader title="회원가입 완료" onBack={() => router.back()} />

        <View className="flex-1 items-center justify-center">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-concierge-surfaceMuted">
            <CheckmarkCircleIcon size={52} color="#95592C" />
          </View>

          <Text className="mt-6 text-center text-xl font-bold text-concierge-text">
            회원가입이 완료되었어요
          </Text>
          <Text className="mt-2 text-center text-sm font-semibold text-concierge-textSecondary">
            MXIS Charm 케어 여정을 시작해 보세요.
          </Text>
          <View className="mt-5 h-px w-[107px] bg-concierge-border" />
        </View>

        <PrimaryButton
          label="다음"
          onPress={() => router.replace("/auth/login")}
        />
        <Text className="mt-3 text-center text-sm text-concierge-textSecondary">
          다음 단계에서 서비스 및 센서 데이터 이용 동의를 진행합니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}
