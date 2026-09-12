import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { careQueryKeys } from "@/features/care/queryKeys";
import {
  connectProductDevice,
  deleteDevice,
  disconnectProductDevice,
  promoteProductDevice,
  setPrimaryProduct,
} from "@/features/device/api/deviceApi";
import type { DisplayCharm, ProductDeviceLink } from "@/features/device/types";
import { homeQueryKeys } from "@/features/home/queryKeys";
import { disconnectSmartCharmConnection } from "@/features/onboarding/ble/smartCharmBle";
import { uploadAndAcknowledgeSmartCharm } from "@/features/onboarding/ble/smartCharmSync";

type Options = {
  ownerId: string;
  productDeviceLinks: ProductDeviceLink[];
  invalidateDeviceQueries: () => Promise<void>;
  onDeleteSuccess: () => void;
  onDisconnectSuccess: () => void;
};

export function useDeviceManagementMutations({
  ownerId,
  productDeviceLinks,
  invalidateDeviceQueries,
  onDeleteSuccess,
  onDisconnectSuccess,
}: Options) {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState("");
  const [syncMessage, setSyncMessage] = useState<{
    serial: string;
    text: string;
  } | null>(null);

  const syncMutation = useMutation({
    mutationFn: async (device: DisplayCharm) => {
      setSyncMessage(null);
      setErrorMessage("");
      return uploadAndAcknowledgeSmartCharm(
        ownerId,
        device.serialNumber,
        device.id,
      );
    },
    onSuccess: async (result, device) => {
      setSyncMessage({ serial: device.serialNumber, text: result.message });
      await invalidateDeviceQueries();
      await queryClient.invalidateQueries({ queryKey: homeQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: careQueryKeys.all });
    },
    onError: (error, device) =>
      setSyncMessage({
        serial: device.serialNumber,
        text:
          error instanceof Error
            ? error.message
            : "센서 동기화에 실패했습니다. 받은 데이터는 보관됩니다.",
      }),
  });

  const primaryProductMutation = useMutation({
    mutationFn: setPrimaryProduct,
    onSuccess: invalidateDeviceQueries,
    onError: (error) =>
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "메인 가방 지정에 실패했습니다.",
      ),
  });

  const connectMutation = useMutation({
    mutationFn: async ({
      productId,
      deviceId,
    }: {
      productId: number;
      deviceId: number;
    }) => {
      const selectedExistingLink = productDeviceLinks.find(
        (link) => link.deviceId === deviceId,
      );
      const linksToDisconnect = productDeviceLinks.filter(
        (link) => link.deviceId !== deviceId,
      );

      await Promise.all(
        linksToDisconnect.map((link) =>
          disconnectProductDevice({ productId, deviceId: link.deviceId }),
        ),
      );

      if (selectedExistingLink) {
        return promoteProductDevice({ productId, deviceId });
      }

      return connectProductDevice({
        productId,
        deviceId,
        role: "PRIMARY_SENSOR",
      });
    },
    onSuccess: async () => {
      setErrorMessage("");
      await invalidateDeviceQueries();
    },
    onError: (error) =>
      setErrorMessage(
        error instanceof Error ? error.message : "참 연결에 실패했습니다.",
      ),
  });

  const disconnectMutation = useMutation({
    mutationFn: async ({
      productId,
      device,
    }: {
      productId: number;
      device: DisplayCharm;
    }) => {
      await disconnectProductDevice({ productId, deviceId: device.id });
      await disconnectSmartCharmConnection(device.macAddress);
    },
    onSuccess: async () => {
      onDisconnectSuccess();
      setErrorMessage("");
      await invalidateDeviceQueries();
    },
    onError: (error) =>
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "참 연결 해제에 실패했습니다.",
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: async (device: DisplayCharm) => {
      await deleteDevice(device.id);
      await disconnectSmartCharmConnection(device.macAddress);
    },
    onSuccess: async () => {
      onDeleteSuccess();
      setErrorMessage("");
      await invalidateDeviceQueries();
    },
    onError: (error) =>
      setErrorMessage(
        error instanceof Error ? error.message : "참 삭제에 실패했습니다.",
      ),
  });

  return {
    connectCharm: connectMutation.mutate,
    deleteCharm: deleteMutation.mutate,
    disconnectCharm: disconnectMutation.mutate,
    errorMessage,
    isConnectPending: connectMutation.isPending,
    isDeletePending: deleteMutation.isPending,
    isDisconnectPending: disconnectMutation.isPending,
    isSetPrimaryPending: primaryProductMutation.isPending,
    isSyncPending: syncMutation.isPending,
    setPrimaryProduct: primaryProductMutation.mutate,
    syncCharm: syncMutation.mutate,
    syncMessage,
  };
}
