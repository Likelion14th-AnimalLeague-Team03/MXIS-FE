import { useEffect, useState } from "react";

import type { Device, ProductDeviceLink } from "@/features/device/types";

const EMPTY_DEVICE_IDS: number[] = [];

type Options = {
  devices: Device[];
  hasLoadedDevices: boolean;
  hasLoadedProductDeviceLinks: boolean;
  productDeviceLinks: ProductDeviceLink[];
  selectedProductId: number | null;
};

export function useDeviceMutationOverlay({
  devices,
  hasLoadedDevices,
  hasLoadedProductDeviceLinks,
  productDeviceLinks,
  selectedProductId,
}: Options) {
  const [pendingDeletedDeviceIds, setPendingDeletedDeviceIds] = useState<
    number[]
  >([]);
  const [pendingDisconnectedDeviceIdsByProduct, setPendingDisconnectedDeviceIdsByProduct] =
    useState<Record<number, number[]>>({});

  useEffect(() => {
    if (!hasLoadedDevices) return;

    const serverDeviceIds = new Set(devices.map((device) => device.id));
    setPendingDeletedDeviceIds((current) => {
      const pendingIds = current.filter((id) => serverDeviceIds.has(id));
      return pendingIds.length === current.length ? current : pendingIds;
    });
  }, [devices, hasLoadedDevices]);

  useEffect(() => {
    if (!hasLoadedProductDeviceLinks || selectedProductId === null) return;

    const serverLinkedDeviceIds = new Set(
      productDeviceLinks.map((link) => link.deviceId),
    );
    setPendingDisconnectedDeviceIdsByProduct((current) => {
      const currentIds = current[selectedProductId];
      if (!currentIds) return current;

      const pendingIds = currentIds.filter((id) =>
        serverLinkedDeviceIds.has(id),
      );
      if (pendingIds.length === currentIds.length) return current;

      const next = { ...current };
      if (pendingIds.length === 0) {
        delete next[selectedProductId];
      } else {
        next[selectedProductId] = pendingIds;
      }
      return next;
    });
  }, [
    hasLoadedProductDeviceLinks,
    productDeviceLinks,
    selectedProductId,
  ]);

  const markDeviceConnected = (productId: number, deviceId: number) => {
    setPendingDisconnectedDeviceIdsByProduct((current) => {
      const currentIds = current[productId];
      if (!currentIds?.includes(deviceId)) return current;

      const next = { ...current };
      const remainingIds = currentIds.filter((id) => id !== deviceId);
      if (remainingIds.length === 0) {
        delete next[productId];
      } else {
        next[productId] = remainingIds;
      }
      return next;
    });
  };

  const markDeviceDeleted = (deviceId: number) => {
    setPendingDeletedDeviceIds((current) =>
      current.includes(deviceId) ? current : [...current, deviceId],
    );
    setPendingDisconnectedDeviceIdsByProduct((current) =>
      Object.fromEntries(
        Object.entries(current)
          .map(([productId, deviceIds]) => [
            productId,
            deviceIds.filter((id) => id !== deviceId),
          ])
          .filter(([, deviceIds]) => deviceIds.length > 0),
      ),
    );
  };

  const markDeviceDisconnected = (productId: number, deviceId: number) => {
    setPendingDisconnectedDeviceIdsByProduct((current) => {
      const currentIds = current[productId] ?? [];
      if (currentIds.includes(deviceId)) return current;

      return { ...current, [productId]: [...currentIds, deviceId] };
    });
  };

  return {
    markDeviceConnected,
    markDeviceDeleted,
    markDeviceDisconnected,
    pendingDeletedDeviceIds,
    pendingDisconnectedDeviceIds:
      selectedProductId === null
        ? EMPTY_DEVICE_IDS
        : pendingDisconnectedDeviceIdsByProduct[selectedProductId] ??
          EMPTY_DEVICE_IDS,
  };
}
