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
import { NotificationSettingsSection } from "@/features/mypage/components/NotificationSettingsSection";
import { ProfileInfoSection } from "@/features/mypage/components/ProfileInfoSection";
import { TermsSections } from "@/features/mypage/components/TermsSections";
import {
  DEFAULT_TERMS_VERSION,
  type MyPageSectionKey,
} from "@/features/mypage/constants";
import {
  useConsents,
  useMyProfile,
  useUpdateConsents,
} from "@/features/mypage/hooks/useMyPageQueries";
import { useNotificationPreferences } from "@/features/mypage/hooks/useNotificationPreferences";
import type { ConsentType } from "@/features/mypage/types";
import { AlertModal } from "@/shared/components/AlertModal";
import { LogoutIcon } from "@/shared/components/icons/LogoutIcon";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { SecondaryButton } from "@/shared/components/SecondaryButton";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function MyPageScreen() {
  const router = useRouter();
  const signOut = useAuthStore((state) => state.signOut);
  const storedUser = useAuthStore((state) => state.user);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [openKey, setOpenKey] = useState<MyPageSectionKey | null>(null);

  const {
    data: fetchedProfile,
    isPending: isProfileLoading,
    error: profileQueryError,
  } = useMyProfile();
  const {
    closeSettingsModal,
    isUpdating: isNotificationUpdating,
    openNotificationSettings,
    permissionMessage,
    settings: notificationSettings,
    settingsError: notificationError,
    settingsModalVisible,
    toggleNotification,
    updateError: notificationUpdateError,
  } = useNotificationPreferences();
  const { data: consents } = useConsents();
  const updateConsents = useUpdateConsents();

  const profile = fetchedProfile ?? storedUser;
  const profileError = profileQueryError?.message ?? null;

  const toggleSection = (key: MyPageSectionKey) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenKey((currentKey) => (currentKey === key ? null : key));
  };

  const handleToggleConsent = (consentType: ConsentType, agreed: boolean) => {
    const currentConsent = consents?.find(
      (consent) => consent.consentType === consentType,
    );

    updateConsents.mutate([
      {
        consentType,
        action: agreed ? "AGREED" : "REVOKED",
        termsVersion: currentConsent?.termsVersion ?? DEFAULT_TERMS_VERSION,
      },
    ]);
  };

  const handleLogout = async () => {
    await signOut();
    setLogoutModalVisible(false);
    router.replace("/auth/login");
  };

  const displayName = profile?.name ?? "회원 정보";
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
            shadowOpacity: 0.18,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View className="size-11 items-center justify-center rounded-full bg-concierge-primary">
            <Text className="text-xl font-bold text-white">
              {profileInitial}
            </Text>
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="text-sm font-bold text-concierge-text">
              {isProfileLoading && !profile ? "회원 정보를 불러오는 중" : displayName}
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

        <View className="mt-5 px-3">
          <ProfileInfoSection
            email={displayEmail}
            expanded={openKey === "info"}
            name={profile?.name ?? "-"}
            onToggle={() => toggleSection("info")}
            phone={displayPhone}
            profileError={profileError}
          />
          <NotificationSettingsSection
            expanded={openKey === "notifications"}
            isUpdating={isNotificationUpdating}
            onToggle={() => toggleSection("notifications")}
            onToggleSetting={(key, value) => void toggleNotification(key, value)}
            permissionMessage={permissionMessage}
            settings={notificationSettings}
            settingsError={notificationError?.message ?? null}
            updateError={notificationUpdateError?.message ?? null}
          />
          <TermsSections
            consents={consents}
            isUpdating={updateConsents.isPending}
            onToggleConsent={handleToggleConsent}
            onToggleSection={(key) => toggleSection(key)}
            openKey={openKey}
            updateError={updateConsents.error?.message ?? null}
          />
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

      <AlertModal
        visible={settingsModalVisible}
        title="알림 권한이 꺼져 있어요."
        description={
          "기기 설정에서 MXIS 알림을 허용해야 알림을 받을 수 있어요.\n설정 > 알림에서 켜주세요."
        }
        layout="column"
        actions={[
          {
            label: "설정으로 이동",
            onPress: openNotificationSettings,
            variant: "accent",
          },
          { label: "나중에", onPress: closeSettingsModal },
        ]}
        onRequestClose={closeSettingsModal}
      />
    </SafeAreaView>
  );
}
