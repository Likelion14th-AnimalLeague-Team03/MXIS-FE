import { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

import kakaoSymbol from "@/features/auth/assets/kakao-symbol.png";
import { useKakaoAuthStore } from "@/features/auth/store/kakaoAuthStore";
import { useAuthStore } from "@/features/auth/store/authStore";
import { getAuthenticatedEntryRoute } from "@/features/onboarding/storage";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { ScreenHeader } from "@/shared/components/ScreenHeader";

const MOCK_KAKAO_PROFILE = {
  accessToken: "mock-kakao-access-token",
  name: "김민지",
  email: "minji@kakao.com",
  phone: "",
};

type ReadonlyFieldProps = {
  label: string;
  value: string;
};

function KakaoReadonlyField({ label, value }: ReadonlyFieldProps) {
  return (
    <View>
      <Text className="mb-2 text-[14px] font-semibold text-concierge-text">
        {label}
      </Text>
      <View className="h-[54px] flex-row items-center rounded-[10px] border border-concierge-border bg-concierge-surfaceMuted px-4">
        <Text
          className="flex-1 text-[16px] font-medium text-concierge-textSecondary"
          style={{ letterSpacing: -0.19 }}
        >
          {value}
        </Text>
        <View className="rounded-full bg-white px-2 py-1">
          <Text className="text-[12px] font-medium text-concierge-textSecondary">
            카카오
          </Text>
        </View>
      </View>
    </View>
  );
}

export function KakaoStartScreen() {
  const router = useRouter();
  const draft = useKakaoAuthStore((state) => state.draft);
  const setDraft = useKakaoAuthStore((state) => state.setDraft);
  const updatePhone = useKakaoAuthStore((state) => state.updatePhone);
  const signInWithKakao = useAuthStore((state) => state.signInWithKakao);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const kakaoProfile = draft ?? MOCK_KAKAO_PROFILE;

  useEffect(() => {
    if (!draft) {
      setDraft(MOCK_KAKAO_PROFILE);
    }
  }, [draft, setDraft]);

  const handleNext = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage("");
      await signInWithKakao(kakaoProfile.accessToken);
      router.replace(await getAuthenticatedEntryRoute());
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "카카오 계정 정보를 다시 확인해 주세요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-concierge-bg">
      <StatusBar style="dark" backgroundColor="#FAF6F1" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 px-6 pb-7 pt-8">
          <ScreenHeader title="카카오로 시작하기" onBack={() => router.back()} />

          <Text
            className="mt-6 text-[14px] font-medium text-concierge-textSecondary"
            style={{ letterSpacing: -0.35, lineHeight: 20 }}
          >
            카카오 계정에서 불러온 정보를 확인해 주세요. 필요한 정보만 추가로
            입력합니다.
          </Text>

          <View className="mt-7 rounded-[12px] bg-concierge-surfaceMuted px-4 py-[14px]">
            <View className="flex-row items-center gap-[10px]">
              <View className="h-[34px] w-[34px] items-center justify-center rounded-full bg-[#FEE500]">
                <Image
                  source={kakaoSymbol}
                  className="h-[16px] w-[18px]"
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text className="text-[14px] font-bold text-concierge-text">
                  카카오 계정
                </Text>
                <Text className="text-[12px] font-medium text-concierge-textSecondary">
                  연결됨
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-6 gap-[14px]">
            <KakaoReadonlyField label="이름" value={kakaoProfile.name} />
            <KakaoReadonlyField label="이메일" value={kakaoProfile.email} />

            <View>
              <Text className="mb-2 text-[14px] font-semibold text-concierge-text">
                휴대전화 번호
                <Text className="text-[12px] font-medium text-[#BABAB2]">
                  {" "}
                  예약 안내에 사용
                </Text>
              </Text>
              <TextInput
                value={kakaoProfile.phone}
                onChangeText={updatePhone}
                placeholder="010-0000-0000"
                placeholderTextColor="#BABAB2"
                keyboardType="phone-pad"
                className="h-[54px] rounded-[10px] border border-concierge-border bg-white px-4 text-[16px] font-medium text-concierge-text"
              />
            </View>
          </View>

          <View className="mt-6 rounded-[12px] bg-concierge-chip px-4 py-[14px]">
            <Text className="text-[14px] font-semibold text-concierge-text">
              비밀번호는 만들지 않아요
            </Text>
            <Text
              className="mt-1 text-[14px] font-medium text-concierge-textSecondary"
              style={{ letterSpacing: -0.35, lineHeight: 20 }}
            >
              앞으로도 카카오 계정으로 간편하게 로그인할 수 있습니다.
            </Text>
          </View>

          <View className="mt-auto">
            {errorMessage ? (
              <Text className="mb-3 text-center text-[12px] font-medium text-[#C04737]">
                {errorMessage}
              </Text>
            ) : null}
            <PrimaryButton
              label={isSubmitting ? "확인 중입니다" : "다음"}
              onPress={handleNext}
              disabled={isSubmitting}
              className="h-[52px] rounded-[10px]"
            />
            <Text
              className="mt-3 text-center text-[14px] font-medium text-concierge-textSecondary"
              style={{ letterSpacing: -0.35, lineHeight: 20 }}
            >
              다음 단계에서 서비스 및 센서 데이터 이용 동의를 진행합니다.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
