import AsyncStorage from "@react-native-async-storage/async-storage";

const CHARM_ONBOARDING_COMPLETED_KEY = "mxis.onboarding.charm.completed";
const PRIMARY_CHARM_PRODUCT_LINK_KEY = "mxis.onboarding.primaryCharmProductLink";

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
  const value = await AsyncStorage.getItem(CHARM_ONBOARDING_COMPLETED_KEY);

  return value === "true";
}

export async function completeCharmOnboarding() {
  await AsyncStorage.setItem(CHARM_ONBOARDING_COMPLETED_KEY, "true");
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

export async function getAuthenticatedEntryRoute() {
  const isCharmOnboardingCompleted = await hasCompletedCharmOnboarding();

  return isCharmOnboardingCompleted ? "/(tabs)" : "/onboarding/charm";
}
