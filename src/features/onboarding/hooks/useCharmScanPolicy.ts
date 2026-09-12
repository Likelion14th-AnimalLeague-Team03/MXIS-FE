import { useEffect, useState } from "react";

import { getConnectionPolicy } from "@/features/onboarding/api/onboardingApi";
import {
  DEFAULT_SMART_CHARM_SERVICE_UUIDS,
  resolveOrangeScanPolicy,
} from "@/features/onboarding/ble/smartCharmBle";
import { logCharmDebug } from "@/features/onboarding/utils/charmLogger";

const DEFAULT_SCAN_TIMEOUT_SECONDS = 8;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "알 수 없는 오류";
}

export function useCharmScanPolicy() {
  const [allowedServiceUuids, setAllowedServiceUuids] = useState(
    DEFAULT_SMART_CHARM_SERVICE_UUIDS,
  );
  const [policyReady, setPolicyReady] = useState(false);
  const [scanTimeoutSeconds, setScanTimeoutSeconds] = useState(
    DEFAULT_SCAN_TIMEOUT_SECONDS,
  );

  useEffect(() => {
    let cancelled = false;

    getConnectionPolicy()
      .then((policy) => {
        if (cancelled) return;
        logCharmDebug("[Charm BLE] server scan policy", {
          allowedServiceUuids: policy.allowedServiceUuids,
        });
        try {
          const uuids = resolveOrangeScanPolicy(policy.allowedServiceUuids);
          setAllowedServiceUuids(uuids);
          logCharmDebug("[Charm BLE] scan policy", {
            source: "server",
            effectiveScanServiceUuids: uuids,
          });
        } catch (error) {
          setAllowedServiceUuids(DEFAULT_SMART_CHARM_SERVICE_UUIDS);
          console.warn(
            "[Charm BLE] incompatible server policy; local Orange UUID configuration used",
            { message: getErrorMessage(error) },
          );
        }
        setScanTimeoutSeconds(
          Number.isFinite(policy.scanTimeoutSeconds)
            ? Math.min(30, Math.max(3, policy.scanTimeoutSeconds))
            : DEFAULT_SCAN_TIMEOUT_SECONDS,
        );
      })
      .catch(() => {
        if (cancelled) return;
        setAllowedServiceUuids(DEFAULT_SMART_CHARM_SERVICE_UUIDS);
        console.warn(
          "[Charm BLE] connection-policy unavailable; local Orange UUID configuration used",
        );
      })
      .finally(() => {
        if (!cancelled) setPolicyReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { allowedServiceUuids, policyReady, scanTimeoutSeconds };
}
