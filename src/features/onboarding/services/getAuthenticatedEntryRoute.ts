import { getDevices } from "@/features/device/api/deviceApi";
import {
  completeCharmOnboarding,
  hasCompletedCharmOnboarding,
} from "@/features/onboarding/storage";

export async function getAuthenticatedEntryRoute() {
  try {
    const registeredDevices = await getDevices();

    if (registeredDevices.length > 0) {
      await completeCharmOnboarding();
      return "/(tabs)" as const;
    }

    return "/onboarding/charm" as const;
  } catch {
    const isCharmOnboardingCompleted = await hasCompletedCharmOnboarding();

    return isCharmOnboardingCompleted
      ? ("/(tabs)" as const)
      : ("/onboarding/charm" as const);
  }
}
