import { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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

const MOCK_LINKED_MCM_EMAILS = ["linked@mcm.com"];

type ReadonlyFieldProps = {
  label: string;
  value: string;
};

function KakaoReadonlyField({ label, value }: ReadonlyFieldProps) {
  return (
    <View>
      <Text className="mb-2 text-sm font-semibold text-concierge-text">
        {label}
      </Text>
      <View className="h-14 flex-row items-center rounded-xl border border-concierge-border bg-concierge-surfaceMuted px-4">
        <Text className="flex-1 text-sm font-medium text-concierge-textSecondary">
          {value}
        </Text>
        <View className="rounded-full bg-white px-2 py-1">
          <Text className="text-xs font-medium text-concierge-textSecondary">
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
  const clearDraft = useKakaoAuthStore((state) => state.clearDraft);
  const signInWithKakao = useAuthStore((state) => state.signInWithKakao);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMissingAccountModalVisible, setIsMissingAccountModalVisible] =
    useState(false);

  const kakaoProfile = draft ?? MOCK_KAKAO_PROFILE;

  useEffect(() => {
    if (!draft) {
      setDraft(MOCK_KAKAO_PROFILE);
    }
  }, [draft, setDraft]);

  const hasLinkedMcmAccount = MOCK_LINKED_MCM_EMAILS.includes(
    kakaoProfile.email.toLowerCase(),
  );

  const handleMissingAccountConfirm = () => {
    setIsMissingAccountModalVisible(false);
    clearDraft();
    router.replace("/auth/login");
  };

  const handleNext = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage("");

      if (!hasLinkedMcmAccount) {
        setIsMissingAccountModalVisible(true);
        return;
      }

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
        <View className="flex-1 px-6 pb-6 pt-6">
          <View className="flex-1">
            <ScreenHeader
              title="카카오로 시작하기"
              onBack={() => router.back()}
            />
            <Text className="mt-6 text-sm text-concierge-textSecondary">
              {
                "카카오 계정에서 불러온 정보를 확인해 주세요.\n필요한 정보만 추가로 입력합니다."
              }
            </Text>

            <View className="mt-5 rounded-xl bg-concierge-surfaceMuted px-4 py-3">
              <View className="flex-row items-center gap-2.5">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-[#FEE500]">
                  <Image
                    source={kakaoSymbol}
                    className="h-4 w-[18px]"
                    resizeMode="contain"
                  />
                </View>
                <View>
                  <Text className="text-sm font-bold text-concierge-text">
                    카카오 계정
                  </Text>
                  <Text className="text-xs text-concierge-textSecondary">
                    연결됨
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-4 gap-3">
              <KakaoReadonlyField label="이름" value={kakaoProfile.name} />
              <KakaoReadonlyField label="이메일" value={kakaoProfile.email} />

              <View>
                <Text className="mb-2 text-sm font-semibold text-concierge-text">
                  휴대전화 번호
                  <Text className="text-xs font-medium text-[#BABAB2]">
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
                  className="h-12 rounded-xl border border-concierge-border bg-white px-4 text-sm font-medium text-concierge-text"
                />
              </View>
            </View>

            <View className="mt-4 rounded-xl bg-concierge-chip px-4 py-3">
              <Text className="text-sm font-semibold text-concierge-text">
                비밀번호는 만들지 않아요
              </Text>
              <Text className="mt-1 text-sm text-concierge-textSecondary">
                앞으로도 카카오 계정으로 간편하게 로그인할 수 있습니다.
              </Text>
            </View>
          </View>

          <View>
            {errorMessage ? (
              <Text className="mb-3 text-center text-xs font-medium text-[#C04737]">
                {errorMessage}
              </Text>
            ) : null}
            <PrimaryButton
              label={isSubmitting ? "확인 중입니다" : "다음"}
              onPress={handleNext}
              disabled={isSubmitting}
            />
            <Text className="mt-3 text-center text-sm text-concierge-textSecondary">
              다음 단계에서 서비스 및 센서 데이터 이용 동의를 진행합니다.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={isMissingAccountModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleMissingAccountConfirm}
      >
        <View className="flex-1 items-center justify-center bg-[rgba(117,117,117,0.57)] px-6">
          <View className="w-full rounded-2xl bg-concierge-surfaceMuted px-5 pb-4 pt-5">
            <Text className="text-xl font-bold text-concierge-text">
              카카오와 연결된{"\n"}MCM 계정을 찾을 수 없어요.
            </Text>

            <Text className="mt-3 text-sm text-concierge-textSecondary">
              MCM 계정으로 로그인 해주세요.
            </Text>

            <Pressable
              onPress={handleMissingAccountConfirm}
              className="mt-4 h-12 items-center justify-center rounded-xl bg-concierge-primary"
            >
              <Text className="text-sm font-semibold text-white">확인</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
