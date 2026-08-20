import * as Notifications from "expo-notifications";
import { Linking } from "react-native";

/**
 * granted: 허용됨 (창을 띄우지 않아요)
 * denied: 이번에 거부했지만 OS가 다음에 다시 물어볼 수 있는 상태
 * blocked: OS가 더 이상 권한 창을 띄우지 않는 상태 — 설정에서 직접 켜야 해요
 */
export type NotificationPermissionResult = "granted" | "denied" | "blocked";

/** 창을 띄우지 않고 현재 권한 상태만 확인해요. */
export async function getNotificationPermission() {
  const permission = await Notifications.getPermissionsAsync();

  return {
    granted: permission.granted,
    /** false면 OS가 권한 창을 띄우지 않아요 (거부 누적 또는 설정에서 끔) */
    canAskAgain: permission.canAskAgain,
  };
}

/**
 * 알림 권한 확보.
 * - 이미 허용돼 있으면 아무 창도 띄우지 않고 바로 granted (온보딩에서 허용했다면 마이페이지에서 다시 안 떠요)
 * - 아직 물어볼 수 있으면 안드로이드 시스템 알림 권한 창을 띄웁니다 (온보딩에서 거부했다면 여기서 다시 떠요)
 * - OS가 더 이상 창을 띄우지 않으면 blocked — 앱 설정으로 안내해야 해요
 *
 * 요청은 항상 expo-notifications를 거쳐야 해요. PermissionsAndroid로 직접 요청하면
 * expo가 "이미 물어봤음" 기록(SharedPreferences)을 남기지 않아서 상태 판단이 어긋납니다.
 */
export async function ensureNotificationPermission(): Promise<NotificationPermissionResult> {
  const current = await Notifications.getPermissionsAsync();

  if (current.granted) {
    return "granted";
  }

  if (!current.canAskAgain) {
    return "blocked";
  }

  const requested = await Notifications.requestPermissionsAsync();

  if (requested.granted) {
    return "granted";
  }

  return requested.canAskAgain ? "denied" : "blocked";
}

/** 앱의 시스템 설정 화면 — blocked 상태에서 알림을 켜려면 여기로 보내야 해요. */
export function openAppNotificationSettings() {
  return Linking.openSettings();
}
