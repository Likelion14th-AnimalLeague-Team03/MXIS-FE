import { useState } from "react";
import {
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";

import { useAuthStore } from "@/features/auth/store/authStore";
import {
  DEFAULT_TERMS_VERSION,
  NOTIFICATION_ITEMS,
} from "@/features/mypage/constants";
import {
  useConsents,
  useMyProfile,
  useNotificationSettings,
  useUpdateConsents,
  useUpdateNotificationSettings,
} from "@/features/mypage/hooks/useMypage";
import type { ConsentType } from "@/features/mypage/types";
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
  /** 서버 동의 상태(GET /users/me/consents)와 이어지는 항목이면 지정해요. */
  consentType?: ConsentType;
  label: string;
  meta: string;
  description: string;
  groups: TermsGroup[];
  linkLabel?: string;
  note?: string;
  /** 선택 동의 항목은 화면에서 켜고 끌 수 있어요. */
  togglable?: boolean;
};

const TERMS_SECTIONS: TermsSection[] = [
  {
    key: "service",
    consentType: "TERMS_OF_SERVICE",
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
    consentType: "PRIVACY",
    label: "개인정보 수집·이용 약관",
    meta: "시행일 2026.08.01",
    description: "서비스 제공을 위해 아래 정보를 수집·이용합니다.",
    groups: [
      {
        heading: "수집 항목",
        content:
          "이름, 이메일, 제품 정보, Smart Charm 연동 정보, 센서 기록 데이터",
      },
      {
        heading: "이용 목적",
        content: "회원 관리 · 제품 케어 · 예약 및 알림 제공",
      },
    ],
    linkLabel: "개인정보 처리방침 전문 보기",
  },
  {
    key: "marketing",
    consentType: "MARKETING",
    label: "브랜드 소식 및 마케팅 알림 약관",
    meta: "선택 동의",
    description: "MCM의 새로운 제품과 브랜드 소식을 받아볼 수 있어요.",
    groups: [
      {
        heading: "안내 내용",
        content: "신제품 · 컬렉션 · 브랜드 이벤트 · MXIS 혜택",
      },
      { heading: "수신 방법", content: "앱 푸시 알림" },
    ],
    note: "동의하지 않아도 기본 서비스 이용에는 제한이 없습니다.",
    togglable: true,
  },
];

// "내 정보 확인"/"알림 설정"도 약관 항목들과 같은 아코디언 그룹에 속해요 — 키 하나로 통일해서 관리합니다.
type SectionKey =
  | "info"
  | "notifications"
  | (typeof TERMS_SECTIONS)[number]["key"];

export function MyPageScreen() {
  const router = useRouter();
  const signOut = useAuthStore((state) => state.signOut);
  const storedUser = useAuthStore((state) => state.user);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [openKey, setOpenKey] = useState<SectionKey | null>(null);

  const {
    data: fetchedProfile,
    isPending: isProfileLoading,
    error: profileQueryError,
  } = useMyProfile();
  const { data: notificationSettings, error: notificationError } =
    useNotificationSettings();
  const updateNotificationSettings = useUpdateNotificationSettings();
  const { data: consents } = useConsents();
  const updateConsents = useUpdateConsents();

  const profile = fetchedProfile ?? storedUser;
  const profileError = profileQueryError?.message ?? null;

  const toggleSection = (key: SectionKey) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenKey((prev) => (prev === key ? null : key));
  };

  const handleToggleNotification = (
    key: (typeof NOTIFICATION_ITEMS)[number]["key"],
    value: boolean,
  ) => {
    updateNotificationSettings.mutate({ [key]: value });
  };

  // 안드로이드는 13(API 33) 이상부터 알림 표시에 런타임 권한이 필요해서,
  // 알림 설정 화면을 열 때 시스템 권한 안내창을 띄우고 결과를 서버에도 알려줘요.
  const handlePressNotificationSection = () => {
    if (Platform.OS === "android") {
      Notifications.requestPermissionsAsync()
        .then((result) => {
          if (result.granted !== notificationSettings?.pushPermissionGranted) {
            updateNotificationSettings.mutate({
              pushPermissionGranted: result.granted,
            });
          }
        })
        .catch(() => {
          // 권한 요청이 실패해도 아코디언은 그대로 열어줘요.
        });
    }
    toggleSection("notifications");
  };

  const findConsent = (consentType?: ConsentType) =>
    consentType
      ? consents?.find((item) => item.consentType === consentType)
      : undefined;

  const handleToggleConsent = (consentType: ConsentType, agreed: boolean) => {
    const current = findConsent(consentType);

    updateConsents.mutate([
      {
        consentType,
        action: agreed ? "AGREED" : "REVOKED",
        termsVersion: current?.termsVersion ?? DEFAULT_TERMS_VERSION,
      },
    ]);
  };

  const handleLogout = async () => {
    await signOut();
    setLogoutModalVisible(false);
    router.replace("/auth/login");
  };

  const displayName = profile?.name ?? "내 정보";
  const displayEmail = profile?.email ?? "-";
  const displayPhone = profile?.phone ?? "-";
  const profileInitial = (displayName.trim().charAt(0) || "M").toUpperCase();

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView className="flex-1 px-6" contentContainerClassName="pb-8">
        <Text className="mt-6 text-xl font-bold text-concierge-text">
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
            <Text className="text-xl font-bold text-white">
              {profileInitial}
            </Text>
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="text-sm font-bold text-concierge-text">
              {isProfileLoading && !profile
                ? "내 정보를 불러오는 중"
                : displayName}
            </Text>
            <Text className="text-sm text-concierge-textSecondary">
              {displayEmail}
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

        <View className="-mx-6 mt-4 border-t border-concierge-borderLight" />

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
                transform: [
                  { rotate: openKey === "info" ? "-90deg" : "90deg" },
                ],
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
                <Text className="text-sm text-concierge-text">
                  {profile?.name ?? "-"}
                </Text>
              </View>
              <View className="flex-row items-center justify-between border-t border-concierge-borderLight px-4 py-3">
                <Text className="text-sm text-concierge-textSecondary">
                  이메일
                </Text>
                <Text className="text-sm text-concierge-text">
                  {displayEmail}
                </Text>
              </View>
              <View className="flex-row items-center justify-between border-t border-concierge-borderLight px-4 py-3">
                <Text className="text-sm text-concierge-textSecondary">
                  연락처
                </Text>
                <Text className="text-sm text-concierge-text">
                  {displayPhone}
                </Text>
              </View>
              {profileError ? (
                <View className="border-t border-concierge-borderLight px-4 py-3">
                  <Text className="text-xs text-[#C04737]">{profileError}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View className="border-t border-concierge-borderLight" />

          <Pressable
            onPress={handlePressNotificationSection}
            className="flex-row items-center justify-between py-2"
          >
            <Text className="text-sm text-concierge-textSecondary">
              알림 설정
            </Text>
            <View
              style={{
                transform: [
                  { rotate: openKey === "notifications" ? "-90deg" : "90deg" },
                ],
              }}
            >
              <ChevronRightIcon size={6} color="#63635E" />
            </View>
          </Pressable>

          {openKey === "notifications" ? (
            <View className="mb-3 mt-1 gap-4 rounded-xl bg-concierge-chip px-4 py-4">
              {NOTIFICATION_ITEMS.map((item) => (
                <View
                  key={item.key}
                  className="flex-row items-center justify-between"
                >
                  <Text className="text-sm text-concierge-text">
                    {item.label}
                  </Text>
                  <Switch
                    value={notificationSettings?.[item.key] ?? false}
                    disabled={!notificationSettings}
                    onValueChange={(value) =>
                      handleToggleNotification(item.key, value)
                    }
                    trackColor={{ false: "#898989", true: "#4EC576" }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              ))}
              {notificationError ? (
                <Text className="text-xs text-[#C04737]">
                  {notificationError.message}
                </Text>
              ) : null}
              {updateNotificationSettings.error ? (
                <Text className="text-xs text-[#C04737]">
                  {updateNotificationSettings.error.message}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View className="border-t border-concierge-borderLight" />

          {TERMS_SECTIONS.map((section, index) => {
            const consent = findConsent(section.consentType);

            return (
              <View key={section.key}>
                <Pressable
                  onPress={() => toggleSection(section.key)}
                  className="flex-row items-center justify-between py-2"
                >
                  <Text className="text-sm text-concierge-textSecondary">
                    {section.label}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <View
                      style={{
                        transform: [
                          {
                            rotate:
                              openKey === section.key ? "-90deg" : "90deg",
                          },
                        ],
                      }}
                    >
                      <ChevronRightIcon size={6} color="#63635E" />
                    </View>
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
                    {section.togglable && section.consentType ? (
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm text-concierge-text">
                          동의하고 소식 받기
                        </Text>
                        <Switch
                          value={consent?.agreed ?? false}
                          disabled={updateConsents.isPending}
                          onValueChange={(value) =>
                            handleToggleConsent(section.consentType!, value)
                          }
                          trackColor={{ false: "#898989", true: "#4EC576" }}
                          thumbColor="#FFFFFF"
                        />
                      </View>
                    ) : null}
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
                    {updateConsents.error ? (
                      <Text className="text-xs text-[#C04737]">
                        {updateConsents.error.message}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {index < TERMS_SECTIONS.length - 1 ? (
                  <View className="border-t border-concierge-borderLight" />
                ) : null}
              </View>
            );
          })}
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
