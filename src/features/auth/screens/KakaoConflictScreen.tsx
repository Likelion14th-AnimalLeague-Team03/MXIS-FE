import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

import { useKakaoAuthStore } from "@/features/auth/store/kakaoAuthStore";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { SecondaryButton } from "@/shared/components/SecondaryButton";

function maskEmail(email?: string) {
  if (!email || !email.includes("@")) {
    return "mi***@gmail.com";
  }

  const [name, domain] = email.split("@");
  const visible = name.slice(0, 2);

  return `${visible}***@${domain}`;
}

export function KakaoConflictScreen() {
  const router = useRouter();
  const draft = useKakaoAuthStore((state) => state.draft);
  const clearDraft = useKakaoAuthStore((state) => state.clearDraft);
  const [notice, setNotice] = useState("");

  const handleConnect = () => {
    setNotice(
      "기존 계정 로그인 후 카카오 계정을 연결하려면 백엔드 연결 API가 추가로 필요합니다.",
    );
  };

  const handleUseAnotherKakao = () => {
    clearDraft();
    router.replace("/auth/login");
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-concierge-bg">
      <StatusBar style="dark" backgroundColor="#FAF6F1" />
      <View className="flex-1 px-6 pb-6 pt-6">
        <View className="flex-1">
          <Text className="text-xl font-bold text-concierge-text">
            기존 계정이 확인됐어요
          </Text>
          <Text className="mt-8 text-sm text-concierge-textSecondary">
            카카오 계정의 이메일과 동일한 MXIS 계정이 있습니다. 기존 기록을
            유지하려면 계정을 연결해 주세요.
          </Text>

          <View className="mt-7 rounded-xl bg-concierge-surfaceMuted p-4">
            <View className="flex-row items-center gap-2.5">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-concierge-primary">
                <Text className="text-xl font-bold text-white">M</Text>
              </View>
              <View>
                <Text className="text-sm font-semibold text-concierge-text">
                  기존 MXIS 계정
                </Text>
                <Text className="mt-0.5 text-sm text-concierge-textSecondary">
                  {maskEmail(draft?.email)}
                </Text>
              </View>
            </View>

            <View className="my-3 h-px bg-concierge-border" />

            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-concierge-textSecondary">
                보존되는 정보
              </Text>
              <Text className="text-sm font-semibold text-concierge-text">
                제품·센서 기록
              </Text>
            </View>
            <View className="mt-2.5 flex-row items-center justify-between">
              <Text className="text-sm text-concierge-textSecondary">
                연결 후 로그인
              </Text>
              <Text className="text-sm font-semibold text-concierge-text">
                카카오로 가능
              </Text>
            </View>
          </View>
        </View>

        <View>
          {notice ? (
            <Text className="mb-3 text-center text-xs font-medium text-[#C04737]">
              {notice}
            </Text>
          ) : null}
          <PrimaryButton label="기존 계정으로 로그인" onPress={handleConnect} />
          <SecondaryButton
            label="다른 카카오 계정 사용"
            onPress={handleUseAnotherKakao}
            className="mt-2"
          />
          <Text className="mt-3 text-center text-sm text-concierge-textSecondary">
            계정 연결은 기존 계정 확인 후 한 번만 진행됩니다.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
