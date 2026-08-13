import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

import kakaoSymbol from "@/features/auth/assets/kakao-symbol.png";
import { AuthTextField } from "@/features/auth/components/AuthTextField";
import { useKakaoAuthStore } from "@/features/auth/store/kakaoAuthStore";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
  getFirstValidationMessage,
  loginSchema,
} from "@/features/auth/utils/validation";
import { PrimaryButton } from "@/shared/components/PrimaryButton";

export function LoginScreen() {
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const setKakaoDraft = useKakaoAuthStore((state) => state.setDraft);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    const parsed = loginSchema.safeParse({ email, password });

    if (!parsed.success) {
      Alert.alert("로그인에 실패했습니다", getFirstValidationMessage(parsed.error));
      return;
    }

    try {
      setIsSubmitting(true);
      await signIn(parsed.data);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert(
        "로그인에 실패했습니다",
        error instanceof Error
          ? error.message
          : "아이디 또는 비밀번호를 다시 확인해 주세요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKakaoLogin = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "카카오 로그인",
        "카카오 로그인은 Android Development Build에서 확인할 수 있습니다.",
      );
      return;
    }

    try {
      const { getProfile, login: kakaoSdkLogin } = await import(
        "@react-native-seoul/kakao-login"
      );
      const token = await kakaoSdkLogin();
      const profile = await getProfile();

      if (!profile.email) {
        Alert.alert(
          "카카오 로그인에 실패했습니다",
          "카카오 계정에서 이메일 정보를 불러올 수 없습니다.",
        );
        return;
      }

      setKakaoDraft({
        accessToken: token.accessToken,
        name: profile.name || profile.nickname || "카카오 사용자",
        email: profile.email,
        phone: profile.phoneNumber ?? "",
      });
      router.push("/auth/kakao-start");
    } catch {
      Alert.alert(
        "카카오 로그인에 실패했습니다",
        "카카오 계정 인증을 다시 시도해 주세요.",
      );
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-concierge-bg">
      <StatusBar style="dark" backgroundColor="#FAF6F1" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 px-6 pb-8 pt-9">
          <View className="flex-row items-center">
            <Text className="text-[20px] font-semibold text-concierge-text">
              MCM
            </Text>
            <View className="mx-2 h-px w-[26px] bg-concierge-border" />
            <Text className="text-[12px] font-medium text-concierge-textSecondary">
              MXIS
            </Text>
          </View>

          <View className="mt-8">
            <Text
              className="text-[22px] font-bold text-concierge-text"
              style={{ letterSpacing: -0.55 }}
            >
              다시 만나 반갑습니다.
            </Text>
            <Text
              className="mt-2 text-[14px] font-medium text-concierge-textSecondary"
              style={{ letterSpacing: -0.35, lineHeight: 20 }}
            >
              MXIS Charm과 함께한 기록을 이어서 확인하세요.
            </Text>
          </View>

          <View className="mt-7 gap-[18px]">
            <AuthTextField
              label="이메일"
              value={email}
              placeholder="name@email.com"
              onChangeText={setEmail}
              keyboardType="email-address"
              textContentType="emailAddress"
            />
            <AuthTextField
              label="비밀번호"
              value={password}
              placeholder="비밀번호를 입력해 주세요"
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
            />

            <View className="flex-row items-center justify-between">
              <Pressable
                onPress={() => router.push("/auth/signup")}
                hitSlop={10}
              >
                <Text className="text-[14px] font-medium text-concierge-text">
                  회원가입
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/auth/forgot-password")}
                hitSlop={10}
              >
                <Text className="text-[14px] font-medium text-concierge-textSecondary">
                  비밀번호 찾기
                </Text>
              </Pressable>
            </View>
          </View>

          <View className="mt-auto">
            <PrimaryButton
              label={isSubmitting ? "확인 중입니다" : "로그인"}
              onPress={handleLogin}
              disabled={isSubmitting}
              className="h-[52px] rounded-[10px]"
            />

            <View className="my-5 flex-row items-center justify-center gap-[10px]">
              <View className="h-px flex-1 bg-concierge-border" />
              <Text className="text-[12px] font-medium text-[#94948C]">
                또는
              </Text>
              <View className="h-px flex-1 bg-concierge-border" />
            </View>

            <Pressable
              onPress={handleKakaoLogin}
              className="h-[52px] flex-row items-center justify-center gap-[10px] rounded-[10px] bg-[#FEE500] px-[18px]"
            >
              <Image
                source={kakaoSymbol}
                className="h-[16px] w-[18px]"
                resizeMode="contain"
              />
              <Text
                className="text-[16px] font-semibold text-[#131313]"
                style={{ letterSpacing: -0.4 }}
              >
                카카오로 로그인
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
