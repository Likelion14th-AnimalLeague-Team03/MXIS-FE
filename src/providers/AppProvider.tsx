import { PropsWithChildren, useEffect } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { disconnectSmartCharmConnection } from "@/features/onboarding/ble/smartCharmBle";

import { QueryProvider } from "./QueryProvider";

export function AppProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    let owner = useAuthStore.getState().user?.id;
    const unsubscribe = useAuthStore.subscribe((state) => {
      if (owner !== state.user?.id || !state.accessToken) void disconnectSmartCharmConnection();
      owner = state.user?.id;
    });
    return () => {
      unsubscribe();
      void disconnectSmartCharmConnection();
    };
  }, []);
  return <QueryProvider>{children}</QueryProvider>;
}
