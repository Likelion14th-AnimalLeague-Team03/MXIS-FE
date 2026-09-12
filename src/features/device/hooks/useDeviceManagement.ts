import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";

import { useAuthStore } from "@/features/auth/store/authStore";
import type {
  DeviceProduct,
  DisplayCharm,
  ProductDeviceManagementSummary,
} from "@/features/device/types";
import {
  formatLastSyncedAt,
  getCharmImage,
  getProductImage,
} from "@/features/device/utils/deviceDisplay";
import { useDeviceManagementMutations } from "./useDeviceManagementMutations";
import { useDeviceManagementQueries } from "./useDeviceManagementQueries";

function createSummaryCharm(
  primaryDevice: NonNullable<ProductDeviceManagementSummary["primaryDevice"]>,
): DisplayCharm {
  return {
    id: primaryDevice.deviceId,
    serialNumber: primaryDevice.serialNumber,
    deviceName: primaryDevice.deviceName ?? primaryDevice.serialNumber,
    deviceImageUrl: primaryDevice.deviceImageUrl ?? null,
    batteryLevel: primaryDevice.batteryLevel ?? null,
    connectionStatus: primaryDevice.connectionStatus ?? "DISCONNECTED",
    lastSyncedAt: primaryDevice.lastSyncedAt ?? null,
    registeredAt: "",
    image: primaryDevice.deviceImageUrl
      ? { uri: primaryDevice.deviceImageUrl }
      : null,
  };
}

export function useDeviceManagement() {
  const router = useRouter();
  const ownerId = useAuthStore((state) => String(state.user?.id ?? ""));
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [pendingDeviceId, setPendingDeviceId] = useState<number | null>(null);
  const [charmExpanded, setCharmExpanded] = useState(false);
  const [charmListExpanded, setCharmListExpanded] = useState(false);
  const [imageModalCharmId, setImageModalCharmId] = useState<number | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [disconnectModalVisible, setDisconnectModalVisible] = useState(false);
  const [lastCharmByProductId, setLastCharmByProductId] = useState<
    Record<number, DisplayCharm>
  >({});

  const {
    devices,
    invalidateDeviceQueries,
    isLoading,
    productDeviceLinks,
    products: productData,
    productSummary: selectedProductSummary,
    queryError,
    summary: primarySummary,
  } = useDeviceManagementQueries(selectedProductId);

  const products = useMemo<DeviceProduct[]>(
    () =>
      productData.map((product) => ({
        ...product,
        image: getProductImage(product),
      })),
    [productData],
  );

  useEffect(() => {
    if (selectedProductId !== null || products.length === 0) return;

    const primaryProduct =
      products.find((product) => product.isPrimary) ??
      products.find(
        (product) => product.id === primarySummary?.primaryProduct?.productId,
      ) ??
      products[0];

    setSelectedProductId(primaryProduct.id);
  }, [products, selectedProductId, primarySummary?.primaryProduct?.productId]);

  const selectedIndex = products.findIndex(
    (product) => product.id === selectedProductId,
  );
  const selectedProduct = selectedIndex >= 0 ? products[selectedIndex] : null;
  const selectedProductIdForDisplay = selectedProduct?.id ?? null;
  const isMainProduct = Boolean(
    selectedProduct &&
      (selectedProduct.isPrimary ||
        selectedProduct.id === primarySummary?.primaryProduct?.productId),
  );

  const displayCharms = useMemo<DisplayCharm[]>(
    () =>
      devices.map((device) => ({
        ...device,
        image: getCharmImage(device),
        link: productDeviceLinks.find((link) => link.deviceId === device.id),
      })),
    [devices, productDeviceLinks],
  );
  const imageModalCharm =
    displayCharms.find((charm) => charm.id === imageModalCharmId) ?? null;
  const primaryDeviceLink =
    productDeviceLinks.find((link) => link.role === "PRIMARY_SENSOR") ??
    productDeviceLinks[0] ??
    null;
  const connectedCharm =
    displayCharms.find((device) => device.id === primaryDeviceLink?.deviceId) ??
    null;
  const summaryPrimaryDevice = selectedProductSummary?.primaryDevice ?? null;
  const displayConnectedCharm = useMemo(
    () =>
      connectedCharm ??
      (summaryPrimaryDevice ? createSummaryCharm(summaryPrimaryDevice) : null),
    [connectedCharm, summaryPrimaryDevice],
  );
  const lastKnownCharm =
    selectedProductIdForDisplay !== null
      ? lastCharmByProductId[selectedProductIdForDisplay]
      : null;
  const cardCharm = displayConnectedCharm ?? lastKnownCharm ?? null;
  const connectedDeviceId = displayConnectedCharm?.id ?? null;
  const pendingCharm =
    displayCharms.find((device) => device.id === pendingDeviceId) ??
    displayConnectedCharm ??
    lastKnownCharm ??
    displayCharms[0] ??
    null;
  const hasConnectedCharm = Boolean(displayConnectedCharm);
  const isPendingCharmLinked = Boolean(
    pendingCharm && pendingCharm.id === connectedDeviceId,
  );
  const lastSyncedLabel = formatLastSyncedAt({
    lastSyncedAt:
      cardCharm?.lastSyncedAt ??
      selectedProductSummary?.currentEnvironment?.measuredAt ??
      null,
  });

  useEffect(() => {
    if (pendingDeviceId !== null) return;
    setPendingDeviceId(cardCharm?.id ?? displayCharms[0]?.id ?? null);
  }, [cardCharm?.id, displayCharms, pendingDeviceId]);

  useEffect(() => {
    if (selectedProductIdForDisplay === null || !displayConnectedCharm) return;

    setLastCharmByProductId((current) => {
      const previous = current[selectedProductIdForDisplay];

      if (
        previous?.id === displayConnectedCharm.id &&
        previous?.serialNumber === displayConnectedCharm.serialNumber &&
        previous?.batteryLevel === displayConnectedCharm.batteryLevel &&
        previous?.connectionStatus === displayConnectedCharm.connectionStatus &&
        previous?.lastSyncedAt === displayConnectedCharm.lastSyncedAt
      ) {
        return current;
      }

      return {
        ...current,
        [selectedProductIdForDisplay]: displayConnectedCharm,
      };
    });
  }, [displayConnectedCharm, selectedProductIdForDisplay]);

  const visibleProducts = useMemo(() => {
    if (!selectedProduct || products.length === 0) return [];

    const previous =
      products[(selectedIndex - 1 + products.length) % products.length];
    const next = products[(selectedIndex + 1) % products.length];

    return products.length === 1
      ? [selectedProduct]
      : [previous, selectedProduct, next];
  }, [products, selectedIndex, selectedProduct]);

  const {
    connectCharm,
    deleteCharm,
    disconnectCharm,
    errorMessage,
    isConnectPending,
    isDeletePending,
    isDisconnectPending,
    isSetPrimaryPending,
    isSyncPending,
    setPrimaryProduct,
    syncCharm,
    syncMessage,
  } = useDeviceManagementMutations({
    ownerId,
    productDeviceLinks,
    invalidateDeviceQueries,
    onDeleteSuccess: () => {
      setDeleteModalVisible(false);
      setPendingDeviceId(null);
    },
    onDisconnectSuccess: () => {
      setDisconnectModalVisible(false);
      setCharmExpanded(false);
      setCharmListExpanded(false);
    },
  });

  const resetCharmSelection = () => {
    setPendingDeviceId(null);
    setCharmExpanded(false);
    setCharmListExpanded(false);
  };

  const moveProduct = (direction: "prev" | "next") => {
    if (products.length === 0 || selectedIndex < 0) return;

    const offset = direction === "prev" ? -1 : 1;
    const nextIndex =
      (selectedIndex + offset + products.length) % products.length;
    setSelectedProductId(products[nextIndex].id);
    resetCharmSelection();
  };

  const selectProduct = (productId: number) => {
    setSelectedProductId(productId);
    resetCharmSelection();
  };

  const setPrimarySelectedProduct = () => {
    if (!selectedProduct || isMainProduct) return;
    setPrimaryProduct(selectedProduct.id);
  };

  const connectSelectedCharm = () => {
    if (!selectedProduct || !pendingCharm) return;
    connectCharm({
      productId: selectedProduct.id,
      deviceId: pendingCharm.id,
    });
  };

  const deleteSelectedCharm = () => {
    if (pendingCharm) deleteCharm(pendingCharm);
  };

  const disconnectSelectedCharm = () => {
    if (!selectedProduct || !pendingCharm) return;

    setLastCharmByProductId((current) => ({
      ...current,
      [selectedProduct.id]: pendingCharm,
    }));
    disconnectCharm({
      productId: selectedProduct.id,
      device: pendingCharm,
    });
  };

  const addCharm = () => {
    router.push({
      pathname: "/onboarding/charm-scan",
      params: { returnTo: "device" },
    });
  };

  const toggleCharmExpanded = () => {
    setCharmListExpanded(false);
    setCharmExpanded((current) => !current);
  };

  const visibleError =
    errorMessage ||
    (queryError instanceof Error ? queryError.message : "") ||
    "";

  return {
    addCharm,
    cardCharm,
    charmExpanded,
    charmListExpanded,
    closeDeleteModal: () => setDeleteModalVisible(false),
    closeDisconnectModal: () => setDisconnectModalVisible(false),
    closeImageModal: () => setImageModalCharmId(null),
    connectSelectedCharm,
    connectedDeviceId,
    deleteModalVisible,
    deleteSelectedCharm,
    disconnectModalVisible,
    disconnectSelectedCharm,
    displayCharms,
    displayConnectedCharm,
    hasConnectedCharm,
    imageModalCharm,
    isConnectPending,
    isDeletePending,
    isDisconnectPending,
    isLoading,
    isMainProduct,
    isPendingCharmLinked,
    isSetPrimaryPending,
    isSyncPending,
    lastSyncedLabel,
    moveProduct,
    openDeleteModal: () => setDeleteModalVisible(true),
    openDisconnectModal: () => setDisconnectModalVisible(true),
    pendingCharm,
    primarySummary,
    selectCharm: setPendingDeviceId,
    selectedProduct,
    selectedProductSummary,
    selectProduct,
    setPrimarySelectedProduct,
    showCharmImage: setImageModalCharmId,
    syncCharm,
    syncMessage,
    toggleCharmExpanded,
    toggleCharmListExpanded: () =>
      setCharmListExpanded((current) => !current),
    visibleError,
    visibleProducts,
  };
}
