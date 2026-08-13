import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

import { signup } from "@/features/auth/api/authApi";
import { AuthTextField } from "@/features/auth/components/AuthTextField";
import {
  getFirstValidationMessage,
  signupSchema,
} from "@/features/auth/utils/validation";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { ScreenHeader } from "@/shared/components/ScreenHeader";

export function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async () => {
    const parsed = signupSchema.safeParse({
      name,
      email,
      password,
      passwordConfirm,
      phone,
    });

    if (!parsed.success) {
      Alert.alert(
        "회원가입할 수 없습니다",
        getFirstValidationMessage(parsed.error),
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const { passwordConfirm: _passwordConfirm, ...request } = parsed.data;
      await signup({
        ...request,
        phone: request.phone || undefined,
      });

      router.replace("/auth/signup-complete");
    } catch (error) {
      Alert.alert(
        "회원가입할 수 없습니다",
        error instanceof Error
          ? error.message
          : "입력하신 정보를 다시 확인해 주세요.",
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
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="px-6 pb-7 pt-9"
        >
          <ScreenHeader title="회원가입" onBack={() => router.back()} />

          <Text
            className="mt-8 text-[14px] font-medium text-concierge-textSecondary"
            style={{ letterSpacing: -0.35, lineHeight: 20 }}
          >
            MXIS Charm 케어 여정을 위한 기본 정보를 입력해 주세요.
          </Text>

          <View className="mt-7 gap-[18px]">
            <AuthTextField
              label="이름"
              value={name}
              placeholder="이름을 입력해 주세요"
              onChangeText={setName}
              textContentType="name"
              autoCapitalize="words"
            />
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
              labelHint="8자 이상"
              value={password}
              placeholder="8자 이상 영문·숫자 조합"
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
            />
            <AuthTextField
              label="비밀번호 확인"
              value={passwordConfirm}
              placeholder="비밀번호를 다시 입력해 주세요"
              onChangeText={setPasswordConfirm}
              secureTextEntry
              textContentType="newPassword"
            />
            <AuthTextField
              label="휴대전화 번호"
              value={phone}
              placeholder="010-0000-0000"
              onChangeText={setPhone}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
            />
          </View>

          <PrimaryButton
            label={isSubmitting ? "확인 중입니다" : "다음"}
            onPress={handleSignup}
            disabled={isSubmitting}
            className="mt-[92px] h-[52px] rounded-[10px]"
          />

          <View className="mt-4 flex-row justify-center gap-1">
            <Text className="text-[14px] font-semibold text-[#898989]">
              이미 계정이 있으신가요?
            </Text>
            <Pressable
              onPress={() => router.replace("/auth/login")}
              hitSlop={10}
            >
              <Text className="text-[14px] font-semibold text-concierge-textSecondary">
                로그인
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
