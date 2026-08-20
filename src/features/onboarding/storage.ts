import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuthStore } from "@/features/auth/store/authStore";
import type { SensorReadingUploadItem } from "@/features/onboarding/api/onboardingApi";

const CHARM_ONBOARDING_COMPLETED_PREFIX = "mxis.onboarding.charm.completed";
const PRIMARY_CHARM_PRODUCT_LINK_KEY = "mxis.onboarding.primaryCharmProductLink";
const PENDING_SENSOR_READINGS_PREFIX = "mxis.onboarding.pendingSensorReadings";

function getOnboardingKey() {
  const userId = useAuthStore.getState().user?.id;
  return userId
    ? `${CHARM_ONBOARDING_COMPLETED_PREFIX}.${userId}`
    : CHARM_ONBOARDING_COMPLETED_PREFIX;
}

function getPendingSensorReadingsKey(deviceId: string) {
  return `${PENDING_SENSOR_READINGS_PREFIX}.${deviceId}`;
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

export async function hasCompletedCharmOnboarding() {
  const value = await AsyncStorage.getItem(getOnboardingKey());

  return value === "true";
}

export async function completeCharmOnboarding() {
  await AsyncStorage.setItem(getOnboardingKey(), "true");
}

export async function savePrimaryCharmProductLink(link: PrimaryCharmProductLink) {
  await AsyncStorage.setItem(PRIMARY_CHARM_PRODUCT_LINK_KEY, JSON.stringify(link));
}

export async function getPrimaryCharmProductLink() {
  const value = await AsyncStorage.getItem(PRIMARY_CHARM_PRODUCT_LINK_KEY);

  if (!value) {
    return null;
  }

  return JSON.parse(value) as PrimaryCharmProductLink;
}

export async function savePendingSensorReadings(
  deviceId: string,
  readings: SensorReadingUploadItem[],
) {
  await AsyncStorage.setItem(
    getPendingSensorReadingsKey(deviceId),
    JSON.stringify(readings),
  );
}

export async function getPendingSensorReadings(deviceId: string) {
  const value = await AsyncStorage.getItem(getPendingSensorReadingsKey(deviceId));

  if (!value) {
    return [];
  }

  return JSON.parse(value) as SensorReadingUploadItem[];
}

export async function clearPendingSensorReadings(deviceId: string) {
  await AsyncStorage.removeItem(getPendingSensorReadingsKey(deviceId));
}

export async function getAuthenticatedEntryRoute() {
  const isCharmOnboardingCompleted = await hasCompletedCharmOnboarding();

  return isCharmOnboardingCompleted ? "/(tabs)" : "/onboarding/charm";
}
