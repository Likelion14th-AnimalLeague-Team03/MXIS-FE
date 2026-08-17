import { useState } from "react";
import {
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
import type { z } from "zod";

import { AuthTextField } from "@/features/auth/components/AuthTextField";
import { signupSchema } from "@/features/auth/utils/validation";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { ScreenHeader } from "@/shared/components/ScreenHeader";

type SignupErrors = {
  name?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
  phone?: string;
  form?: string;
};

function getSignupValidationErrors(error: z.ZodError): SignupErrors {
  return error.issues.reduce<SignupErrors>((acc, issue) => {
    const field = issue.path[0];

    if (
      field === "name" ||
      field === "email" ||
      field === "password" ||
      field === "passwordConfirm" ||
      field === "phone"
    ) {
      acc[field] = issue.message;
    }

    return acc;
  }, {});
}

export function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<SignupErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFieldError = (field: keyof SignupErrors) => {
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  };

  const handleSignup = async () => {
    const parsed = signupSchema.safeParse({
      name,
      email,
      password,
      passwordConfirm,
      phone,
    });

    if (!parsed.success) {
      setErrors(getSignupValidationErrors(parsed.error));
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});

      router.replace("/auth/signup-complete");
    } catch (error) {
      setErrors({
        form:
          error instanceof Error
            ? error.message
            : "입력하신 정보를 다시 확인해 주세요.",
      });
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
          contentContainerClassName="px-6 pb-7 pt-6"
        >
          <ScreenHeader title="회원가입" onBack={() => router.back()} />

          <Text className="mt-5 text-sm text-concierge-textSecondary">
            MXIS Charm 케어 여정을 위한 기본 정보를 입력해 주세요.
          </Text>

          <View className="mt-5 gap-3.5">
            <AuthTextField
              label="이름"
              value={name}
              placeholder="이름을 입력해 주세요"
              onChangeText={(value) => {
                setName(value);
                clearFieldError("name");
              }}
              textContentType="name"
              autoCapitalize="words"
              error={errors.name}
            />
            <AuthTextField
              label="이메일"
              value={email}
              placeholder="name@email.com"
              onChangeText={(value) => {
                setEmail(value);
                clearFieldError("email");
              }}
              keyboardType="email-address"
              textContentType="emailAddress"
              error={errors.email}
            />
            <AuthTextField
              label="비밀번호"
              labelHint="8자 이상"
              value={password}
              placeholder="8자 이상 영문·숫자 조합"
              onChangeText={(value) => {
                setPassword(value);
                clearFieldError("password");
              }}
              secureTextEntry
              textContentType="newPassword"
              error={errors.password}
            />
            <AuthTextField
              label="비밀번호 확인"
              value={passwordConfirm}
              placeholder="비밀번호를 다시 입력해 주세요"
              onChangeText={(value) => {
                setPasswordConfirm(value);
                clearFieldError("passwordConfirm");
              }}
              secureTextEntry
              textContentType="newPassword"
              error={errors.passwordConfirm}
            />
            <AuthTextField
              label="휴대전화 번호"
              value={phone}
              placeholder="010-0000-0000"
              onChangeText={(value) => {
                setPhone(value);
                clearFieldError("phone");
              }}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              error={errors.phone}
            />
          </View>

          {errors.form ? (
            <Text className="mt-5 text-center text-xs font-medium text-[#C04737]">
              {errors.form}
            </Text>
          ) : null}

          <PrimaryButton
            label={isSubmitting ? "확인 중입니다" : "다음"}
            onPress={handleSignup}
            disabled={isSubmitting}
            className={errors.form ? "mt-4" : "mt-8"}
          />

          <View className="mt-4 flex-row justify-center gap-1">
            <Text className="text-sm font-semibold text-concierge-textMuted">
              이미 계정이 있으신가요?
            </Text>
            <Pressable
              onPress={() => router.replace("/auth/login")}
              hitSlop={10}
            >
              <Text className="text-sm font-semibold text-concierge-textSecondary">
                로그인
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
