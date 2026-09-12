import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuthStore } from "@/features/auth/store/authStore";

const CHARM_ONBOARDING_COMPLETED_PREFIX = "mxis.onboarding.charm.completed";
const PRIMARY_CHARM_PRODUCT_LINK_KEY_PREFIX =
  "mxis.onboarding.primaryCharmProductLink";
function getOnboardingKey() {
  const userId = useAuthStore.getState().user?.id;
  return userId
    ? `${CHARM_ONBOARDING_COMPLETED_PREFIX}.${userId}`
    : CHARM_ONBOARDING_COMPLETED_PREFIX;
}

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

export async function hasCompletedCharmOnboarding() {
  const value = await AsyncStorage.getItem(getOnboardingKey());

  return value === "true";
}

export async function completeCharmOnboarding() {
  await AsyncStorage.setItem(getOnboardingKey(), "true");
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
