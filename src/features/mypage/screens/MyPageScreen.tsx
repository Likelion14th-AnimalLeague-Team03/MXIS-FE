import { useState } from "react";
import {
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
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

type TermsGroup = { heading: string; content: string };

type TermsSection = {
  key: string;
  label: string;
  meta: string;
  description: string;
  groups: TermsGroup[];
  linkLabel?: string;
  note?: string;
};

const TERMS_SECTIONS: TermsSection[] = [
  {
    key: "service",
    label: "서비스 이용약관",
    meta: "시행일 2026.08.01",
    description: "MXIS 서비스 이용 조건과 권리·의무를 안내합니다.",
    groups: [
      {
        heading: "주요 내용",
        content: "서비스 제공 · Smart Charm 연결 · 케어 정보 · 예약",
      },
    ],
    linkLabel: "서비스 이용약관 전문 보기",
  },
  {
    key: "privacy",
    label: "개인정보 수집·이용 약관",
    meta: "시행일 2026.08.01",
    description: "서비스 제공을 위해 아래 정보를 수집·이용합니다.",
    groups: [
      {
        heading: "수집 항목",
        content: "이름, 이메일, 제품 정보, Smart Charm 연동 정보, 센서 기록 데이터",
      },
      { heading: "이용 목적", content: "회원 관리 · 제품 케어 · 예약 및 알림 제공" },
    ],
    linkLabel: "개인정보 처리방침 전문 보기",
  },
  {
    key: "marketing",
    label: "브랜드 소식 및 마케팅 알림 약관",
    meta: "선택 동의",
    description: "MCM의 새로운 제품과 브랜드 소식을 받아볼 수 있어요.",
    groups: [
      { heading: "안내 내용", content: "신제품 · 컬렉션 · 브랜드 이벤트 · MXIS 혜택" },
      { heading: "수신 방법", content: "앱 푸시 알림" },
    ],
    note: "동의하지 않아도 기본 서비스 이용에는 제한이 없습니다.",
  },
];

// "내 정보 확인"도 다른 약관 항목들과 같은 아코디언 그룹에 속해요 — 키 하나로 통일해서 관리합니다.
type SectionKey = "info" | (typeof TERMS_SECTIONS)[number]["key"];

export function MyPageScreen() {
  const router = useRouter();
  const signOut = useAuthStore((state) => state.signOut);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [openKey, setOpenKey] = useState<SectionKey | null>(null);

  const toggleSection = (key: SectionKey) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenKey((prev) => (prev === key ? null : key));
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
            onPress={() => toggleSection("info")}
            className="flex-row items-center justify-between py-2"
          >
            <Text className="text-sm text-concierge-textSecondary">
              내 정보 확인
            </Text>
            <View
              style={{
                transform: [{ rotate: openKey === "info" ? "-90deg" : "90deg" }],
              }}
            >
              <ChevronRightIcon size={6} color="#63635E" />
            </View>
          </Pressable>

          {openKey === "info" ? (
            <View className="mb-3 mt-1 gap-px overflow-hidden rounded-xl bg-concierge-chip">
              <View className="flex-row items-center justify-between px-4 py-3">
                <Text className="text-sm text-concierge-textSecondary">
                  이름
                </Text>
                <Text className="text-sm text-concierge-text">MCM 고객</Text>
              </View>
              <View className="flex-row items-center justify-between border-t border-concierge-borderLight px-4 py-3">
                <Text className="text-sm text-concierge-textSecondary">
                  이메일
                </Text>
                <Text className="text-sm text-concierge-text">
                  mi***@gmail.com
                </Text>
              </View>
            </View>
          ) : null}

          <View className="border-t border-concierge-borderLight" />

          {TERMS_SECTIONS.map((section, index) => (
            <View key={section.key}>
              <Pressable
                onPress={() => toggleSection(section.key)}
                className="flex-row items-center justify-between py-2"
              >
                <Text className="text-sm text-concierge-textSecondary">
                  {section.label}
                </Text>
                <View
                  style={{
                    transform: [
                      { rotate: openKey === section.key ? "-90deg" : "90deg" },
                    ],
                  }}
                >
                  <ChevronRightIcon size={6} color="#63635E" />
                </View>
              </Pressable>

              {openKey === section.key ? (
                <View className="mb-3 mt-1 gap-3 rounded-xl bg-concierge-chip px-4 py-4">
                  <Text className="text-xs text-concierge-textMuted">
                    {section.meta}
                  </Text>
                  <Text className="text-sm text-concierge-text">
                    {section.description}
                  </Text>
                  {section.groups.map((group) => (
                    <View key={group.heading}>
                      <Text className="text-sm font-semibold text-concierge-text">
                        {group.heading}
                      </Text>
                      <Text className="mt-1 text-sm text-concierge-textSecondary">
                        {group.content}
                      </Text>
                    </View>
                  ))}
                  {section.linkLabel ? (
                    <Pressable>
                      <Text className="text-sm font-semibold text-concierge-primary">
                        {section.linkLabel} 〉
                      </Text>
                    </Pressable>
                  ) : null}
                  {section.note ? (
                    <Text className="text-xs text-concierge-textMuted">
                      {section.note}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {index < TERMS_SECTIONS.length - 1 ? (
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
