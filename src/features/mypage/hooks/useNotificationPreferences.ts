import { useEffect, useRef, useState } from "react";

import type { NotificationSettingKey } from "@/features/mypage/constants";
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from "@/features/mypage/hooks/useMyPageQueries";
import {
  ensureNotificationPermission,
  getNotificationPermission,
  openAppNotificationSettings,
} from "@/shared/notifications/notificationPermission";

export function useNotificationPreferences() {
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);
  const syncedPermissionRef = useRef<boolean | null>(null);
  const { data: settings, error: settingsError } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();
  const mutateSettings = updateSettings.mutate;
  const serverPushGranted = settings?.pushPermissionGranted;

  useEffect(() => {
    if (serverPushGranted === undefined) return;

    let cancelled = false;

    const syncPermission = async () => {
      try {
        const { granted } = await getNotificationPermission();

        if (
          cancelled ||
          granted === serverPushGranted ||
          syncedPermissionRef.current === granted
        ) {
          return;
        }

        syncedPermissionRef.current = granted;
        mutateSettings({ pushPermissionGranted: granted });
      } catch {
        // Keep the server value when the OS permission state cannot be read.
      }
    };

    void syncPermission();
    return () => {
      cancelled = true;
    };
  }, [mutateSettings, serverPushGranted]);

  const requestNotificationPermission = async () => {
    const result = await ensureNotificationPermission();

    if (result === "blocked") {
      setSettingsModalVisible(true);
      return false;
    }
    if (result === "denied") {
      setPermissionMessage(
        "알림 권한을 허용하면 해당 알림을 받을 수 있습니다.",
      );
      return false;
    }

    return true;
  };

  const toggleNotification = async (
    key: NotificationSettingKey,
    value: boolean,
  ) => {
    setPermissionMessage(null);

    if (!value) {
      mutateSettings({ [key]: false });
      return;
    }

    try {
      const granted = await requestNotificationPermission();
      if (!granted) {
        mutateSettings({ pushPermissionGranted: false });
        return;
      }

      mutateSettings({ [key]: true, pushPermissionGranted: true });
    } catch {
      setPermissionMessage(
        "알림 권한 상태를 확인하지 못했습니다.",
      );
    }
  };

  return {
    closeSettingsModal: () => setSettingsModalVisible(false),
    isUpdating: updateSettings.isPending,
    openNotificationSettings: () => {
      setSettingsModalVisible(false);
      void openAppNotificationSettings();
    },
    permissionMessage,
    settings,
    settingsError,
    settingsModalVisible,
    toggleNotification,
    updateError: updateSettings.error,
  };
}
