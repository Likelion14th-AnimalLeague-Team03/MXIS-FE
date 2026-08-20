import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuthStore } from "@/features/auth/store/authStore";

const CHARM_ONBOARDING_COMPLETED_KEY_PREFIX = "mxis.onboarding.charm.completed";
const PRIMARY_CHARM_PRODUCT_LINK_KEY_PREFIX =
  "mxis.onboarding.primaryCharmProductLink";

// 계정 구분이 없던 시절의 키입니다. 남아 있으면 다른 계정도 온보딩을 건너뛰게 되므로 정리합니다.
const LEGACY_KEYS = [
  CHARM_ONBOARDING_COMPLETED_KEY_PREFIX,
  PRIMARY_CHARM_PRODUCT_LINK_KEY_PREFIX,
];

export type PrimaryCharmProductLink = {
  charmName: string;
  productId: string;
  productName: string;
  material: string;
  color: string;
  productCode: string;
  linkedAt: string;
};

function getCurrentUserId() {
  return useAuthStore.getState().user?.id ?? null;
}

function getScopedKey(prefix: string, userId: number) {
  return `${prefix}.${userId}`;
}

async function removeLegacyKeys() {
  await AsyncStorage.multiRemove(LEGACY_KEYS);
}

export async function hasCompletedCharmOnboarding() {
  const userId = getCurrentUserId();

  if (userId === null) {
    return false;
  }

  const value = await AsyncStorage.getItem(
    getScopedKey(CHARM_ONBOARDING_COMPLETED_KEY_PREFIX, userId),
  );

  return value === "true";
}

export async function completeCharmOnboarding() {
  const userId = getCurrentUserId();

  if (userId === null) {
    return;
  }

  await AsyncStorage.setItem(
    getScopedKey(CHARM_ONBOARDING_COMPLETED_KEY_PREFIX, userId),
    "true",
  );
}

export async function savePrimaryCharmProductLink(link: PrimaryCharmProductLink) {
  const userId = getCurrentUserId();

  if (userId === null) {
    return;
  }

  await AsyncStorage.setItem(
    getScopedKey(PRIMARY_CHARM_PRODUCT_LINK_KEY_PREFIX, userId),
    JSON.stringify(link),
  );
}

export async function getPrimaryCharmProductLink() {
  const userId = getCurrentUserId();

  if (userId === null) {
    return null;
  }

  const value = await AsyncStorage.getItem(
    getScopedKey(PRIMARY_CHARM_PRODUCT_LINK_KEY_PREFIX, userId),
  );

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as PrimaryCharmProductLink;
  } catch {
    await AsyncStorage.removeItem(
      getScopedKey(PRIMARY_CHARM_PRODUCT_LINK_KEY_PREFIX, userId),
    );
    return null;
  }
}

// 시연용: 로그인할 때마다 온보딩(Charm 연결)부터 보여줍니다.
// 완료 여부를 무시하므로, 원래 동작(계정별 1회)으로 돌리려면 false로 바꿔 주세요.
const ALWAYS_SHOW_ONBOARDING = true;

export async function getAuthenticatedEntryRoute() {
  await removeLegacyKeys();

  if (ALWAYS_SHOW_ONBOARDING) {
    return "/onboarding/charm";
  }

  const isCharmOnboardingCompleted = await hasCompletedCharmOnboarding();

  return isCharmOnboardingCompleted ? "/(tabs)" : "/onboarding/charm";
}
