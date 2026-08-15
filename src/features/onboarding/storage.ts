import AsyncStorage from "@react-native-async-storage/async-storage";

const CHARM_ONBOARDING_COMPLETED_KEY = "mxis.onboarding.charm.completed";

export async function hasCompletedCharmOnboarding() {
  const value = await AsyncStorage.getItem(CHARM_ONBOARDING_COMPLETED_KEY);

  return value === "true";
}

export async function completeCharmOnboarding() {
  await AsyncStorage.setItem(CHARM_ONBOARDING_COMPLETED_KEY, "true");
}

export async function getAuthenticatedEntryRoute() {
  const isCharmOnboardingCompleted = await hasCompletedCharmOnboarding();

  return isCharmOnboardingCompleted ? "/(tabs)" : "/onboarding/charm";
}
