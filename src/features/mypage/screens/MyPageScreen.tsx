import { useState } from "react";
import {
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useAuthStore } from "@/features/auth/store/authStore";
import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";
import { LogoutIcon } from "@/shared/components/icons/LogoutIcon";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { SecondaryButton } from "@/shared/components/SecondaryButton";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const OTHER_LINKS = [
  "서비스 이용약관",
  "개인정보 수집·이용 약관",
  "브랜드 소식 및 마케팅 알림 약관",
];

const IS_SOCIAL_LOGIN = false;

export function MyPageScreen() {
  const router = useRouter();
  const signOut = useAuthStore((state) => state.signOut);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [name, setName] = useState("MCM 고객");
  const [email, setEmail] = useState("mi***@gmail.com");
  const [password, setPassword] = useState("");

  const toggleInfo = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setInfoExpanded((prev) => !prev);
  };

  const handleSaveInfo = () => {
    toggleInfo();
  };

  const handleLogout = async () => {
    await signOut();
    setLogoutModalVisible(false);
    router.replace("/auth/login");
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView className="flex-1 px-6" contentContainerClassName="pb-8">
        <Text className="mt-10 text-xl font-bold text-concierge-text">
          마이페이지
        </Text>

        <View
          className="mt-4 flex-row items-center gap-3 rounded-xl bg-concierge-surfaceMuted px-4 py-4"
          style={{
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <View className="size-11 items-center justify-center rounded-full bg-concierge-primary">
            <Text className="text-xl font-bold text-white">M</Text>
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="text-sm font-bold text-concierge-text">
              기존 MXIS 계정
            </Text>
            <Text className="text-sm text-concierge-textSecondary">
              mi***@gmail.com
            </Text>
          </View>
          <Pressable
            onPress={() => setLogoutModalVisible(true)}
            className="flex-row items-center gap-1"
          >
            <Text className="text-[11px] text-[#757575]">로그아웃</Text>
            <LogoutIcon size={12} color="#757575" />
          </Pressable>
        </View>

        <View className="-mx-6 mt-[11px] border-t border-concierge-borderLight" />

        <View className="mt-[20px] px-3">
          <Pressable
            onPress={toggleInfo}
            className="flex-row items-center justify-between py-2"
          >
            <Text className="text-sm text-concierge-textSecondary">
              내 정보 변경
            </Text>
            <View
              style={{ transform: [{ rotate: infoExpanded ? "-90deg" : "90deg" }] }}
            >
              <ChevronRightIcon size={6} color="#63635E" />
            </View>
          </Pressable>

          {infoExpanded ? (
            <View className="mb-3 mt-1 gap-px overflow-hidden rounded-xl bg-concierge-chip">
              <View className="flex-row items-center justify-between px-4 py-3">
                <Text className="text-sm text-concierge-textSecondary">
                  이름
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  className="ml-4 flex-1 text-right text-sm text-concierge-text"
                />
              </View>
              <View className="flex-row items-center justify-between px-4 py-3">
                <Text className="text-sm text-concierge-textSecondary">
                  이메일
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="ml-4 flex-1 text-right text-sm text-concierge-text"
                />
              </View>
              {!IS_SOCIAL_LOGIN ? (
                <View className="flex-row items-center justify-between px-4 py-3">
                  <Text className="text-sm text-concierge-textSecondary">
                    비밀번호
                  </Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholder="변경할 비밀번호 입력"
                    placeholderTextColor="#B8B3AE"
                    className="ml-4 flex-1 text-right text-sm text-concierge-text"
                  />
                </View>
              ) : null}
            </View>
          ) : null}

          {infoExpanded ? (
            <PrimaryButton
              label="저장하기"
              onPress={handleSaveInfo}
              className="mb-3"
            />
          ) : null}

          <View className="border-t border-concierge-borderLight" />

          {OTHER_LINKS.map((label, index) => (
            <View key={label}>
              <Pressable className="flex-row items-center justify-between py-2">
                <Text className="text-sm text-concierge-textSecondary">
                  {label}
                </Text>
                <ChevronRightIcon size={6} color="#63635E" />
              </Pressable>
              {index < OTHER_LINKS.length - 1 ? (
                <View className="border-t border-concierge-borderLight" />
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={logoutModalVisible}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full rounded-2xl bg-concierge-surfaceMuted p-5">
            <Text className="text-lg font-bold text-concierge-text">
              로그아웃하시겠어요?
            </Text>
            <Text className="mt-2 text-sm text-concierge-textSecondary">
              다시 로그인하기 전까지 MXIS Charm 기록 동기화가 잠시 멈춥니다.
            </Text>
            <PrimaryButton
              label="로그아웃"
              onPress={handleLogout}
              className="mt-4"
            />
            <SecondaryButton
              label="취소"
              onPress={() => setLogoutModalVisible(false)}
              className="mt-2"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
