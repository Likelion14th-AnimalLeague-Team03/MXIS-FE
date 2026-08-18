import { useEffect, useMemo, useState } from "react";
import {
  Image,
  type ImageSourcePropType,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import {
  connectProductDevice,
  deleteDevice,
  disconnectProductDevice,
  getDeviceManagementSummary,
  getDevices,
  getProductDevices,
  getProductDeviceManagementSummary,
  getProducts,
  promoteProductDevice,
  setPrimaryProduct,
  type Device,
  type DeviceManagementSummary,
  type ProductDeviceManagementSummary,
  type ProductDeviceLink,
} from "@/features/device/api/deviceApi";
import heroBackground from "@/features/device/assets/final/device-hero-bg-final.png";
import type { Product } from "@/features/product/types";
import { useAuthStore } from "@/features/auth/store/authStore";
import { BatteryIcon } from "@/shared/components/icons/BatteryIcon";
import { InfoIcon } from "@/shared/components/icons/InfoIcon";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { SecondaryButton } from "@/shared/components/SecondaryButton";

const deviceQueryKeys = {
  summary: ["device", "summary"] as const,
  products: ["device", "products"] as const,
  devices: ["device", "devices"] as const,
  productDevices: (productId: number | null) =>
    ["device", "product-devices", productId] as const,
  productSummary: (productId: number | null) =>
    ["device", "product-summary", productId] as const,
};

type DeviceProduct = Product & {
  image: ImageSourcePropType | null;
};

type DisplayCharm = Device & {
  image: ImageSourcePropType | null;
  link?: ProductDeviceLink;
};

function getProductImage(product: Product): ImageSourcePropType | null {
  if (product.productImageUrl) {
    return { uri: product.productImageUrl };
  }

  return null;
}

function getCharmImage(device: Device): ImageSourcePropType | null {
  if (device.deviceImageUrl) {
    return { uri: device.deviceImageUrl };
  }

  return null;
}

function isSameProduct(
  product: Product | null,
  summary?: DeviceManagementSummary | null,
) {
  return Boolean(
    product &&
    summary?.primaryProduct &&
    product.id === summary.primaryProduct.productId,
  );
}

function getProductSummaryProductId(
  summary?: ProductDeviceManagementSummary | null,
) {
  return summary?.product?.productId ?? summary?.product?.id ?? null;
}

function isSameProductSummary(
  product: Product | null,
  summary?: ProductDeviceManagementSummary | null,
) {
  return Boolean(product && product.id === getProductSummaryProductId(summary));
}

function formatMaterialColor(product: Product) {
  const material = product.materialDisplayName ?? "-";
  const color = product.color ?? "-";
  return `${material} · ${color}`;
}

function normalizeCount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getTotalOutingCount(
  product: Product | null,
  productSummary?: ProductDeviceManagementSummary | null,
  primarySummary?: DeviceManagementSummary | null,
) {
  if (isSameProductSummary(product, productSummary)) {
    const count =
      normalizeCount(productSummary?.totalOutingCount) ??
      normalizeCount(productSummary?.outingCount) ??
      normalizeCount(productSummary?.totalOutings) ??
      normalizeCount(productSummary?.totalOutingSessions);

    if (count !== null) {
      return count;
    }
  }

  if (isSameProduct(product, primarySummary)) {
    return normalizeCount(primarySummary?.totalOutingCount);
  }

  return null;
}

function formatOutingCount(
  product: Product | null,
  summary?: ProductDeviceManagementSummary | null,
  primarySummary?: DeviceManagementSummary | null,
) {
  const count = getTotalOutingCount(product, summary, primarySummary);

  if (count === null) {
    return "-";
  }

  return `${count}회`;
}

function formatTemperature(
  product: Product | null,
  summary?: ProductDeviceManagementSummary | null,
) {
  if (
    !isSameProductSummary(product, summary) ||
    summary?.currentEnvironment == null
  ) {
    return "-°C";
  }

  const value = summary.currentEnvironment.temperature;
  return typeof value === "number" ? `${Math.round(value)}°C` : "-°C";
}

function formatHumidity(
  product: Product | null,
  summary?: ProductDeviceManagementSummary | null,
) {
  if (
    !isSameProductSummary(product, summary) ||
    summary?.currentEnvironment == null
  ) {
    return "-%";
  }

  const value = summary.currentEnvironment.humidity;
  return typeof value === "number" ? `${Math.round(value)}%` : "-%";
}

function formatLastSyncedAt(device: DisplayCharm | null) {
  if (!device) return "*월 *일";
  if (device.connectionStatus === "CONNECTED") return "방금 전";
  if (!device.lastSyncedAt) return "*월 *일";

  const syncedAt = new Date(device.lastSyncedAt).getTime();
  if (Number.isNaN(syncedAt)) return "*월 *일";

  const diffMs = Math.max(0, Date.now() - syncedAt);
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));

  if (diffHours < 1) return "방금 전";
  if (diffHours < 24) return `${diffHours}시간 전`;

  const date = new Date(device.lastSyncedAt);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function Pill({ label }: { label: string }) {
  return (
    <View className="rounded-full border border-[#814C27] px-[9px] py-[3px]">
      <Text className="text-[11px] font-medium text-[#814C27]">{label}</Text>
    </View>
  );
}

function Chevron({ expanded }: { expanded?: boolean }) {
  return (
    <View className="h-6 w-6 items-center justify-center">
      <Svg
        width={15}
        height={9}
        viewBox="0 0 15 9"
        fill="none"
        style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
      >
        <Path
          d="M1.25 1.5L7.5 7.25L13.75 1.5"
          stroke="#111111"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

function ConfirmModal({
  visible,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  isPending,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 items-center justify-center bg-black/35 px-6">
        <View className="w-full max-w-[342px] rounded-[16px] bg-[#FAF6F1] px-5 pb-[18px] pt-[22px]">
          <Text className="text-[20px] font-semibold text-[#121212]">
            {title}
          </Text>
          <Text className="mt-[14px] text-[14px] font-medium leading-5 text-[#63635E]">
            {body}
          </Text>
          <PrimaryButton
            label={isPending ? "처리 중입니다" : confirmLabel}
            onPress={onConfirm}
            disabled={isPending}
            className="mt-[18px] h-[48px] rounded-[8px]"
          />
          <SecondaryButton
            label="취소"
            onPress={onCancel}
            className="mt-[10px] h-[48px] rounded-[8px]"
          />
          <Text className="mt-[12px] text-center text-[12px] font-medium text-[#898989]">
            기존 기록은 삭제되지 않습니다.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

export function DeviceScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [pendingDeviceId, setPendingDeviceId] = useState<number | null>(null);
  const [charmExpanded, setCharmExpanded] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [disconnectModalVisible, setDisconnectModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastCharmByProductId, setLastCharmByProductId] = useState<
    Record<number, DisplayCharm>
  >({});
  const enabled = Boolean(accessToken);

  const summaryQuery = useQuery({
    queryKey: deviceQueryKeys.summary,
    queryFn: getDeviceManagementSummary,
    enabled,
  });
  const productsQuery = useQuery({
    queryKey: deviceQueryKeys.products,
    queryFn: getProducts,
    enabled,
  });
  const devicesQuery = useQuery({
    queryKey: deviceQueryKeys.devices,
    queryFn: getDevices,
    enabled,
  });

  const products = useMemo<DeviceProduct[]>(() => {
    return (productsQuery.data ?? []).map((product) => {
      const image = getProductImage(product);
      return { ...product, image };
    });
  }, [productsQuery.data]);

  useEffect(() => {
    if (selectedProductId !== null || products.length === 0) return;

    const primaryProduct =
      products.find((product) => product.isPrimary) ??
      products.find(
        (product) =>
          product.id === summaryQuery.data?.primaryProduct?.productId,
      ) ??
      products[0];

    setSelectedProductId(primaryProduct.id);
  }, [
    products,
    selectedProductId,
    summaryQuery.data?.primaryProduct?.productId,
  ]);

  const selectedIndex = products.findIndex(
    (product) => product.id === selectedProductId,
  );
  const selectedProduct = selectedIndex >= 0 ? products[selectedIndex] : null;
  const isMainProduct = Boolean(
    selectedProduct &&
    (selectedProduct.isPrimary ||
      selectedProduct.id === summaryQuery.data?.primaryProduct?.productId),
  );

  const productDevicesQuery = useQuery({
    queryKey: deviceQueryKeys.productDevices(selectedProduct?.id ?? null),
    queryFn: () => getProductDevices(selectedProduct?.id as number),
    enabled: enabled && Boolean(selectedProduct?.id),
  });
  const productSummaryQuery = useQuery({
    queryKey: deviceQueryKeys.productSummary(selectedProduct?.id ?? null),
    queryFn: () =>
      getProductDeviceManagementSummary(selectedProduct?.id as number),
    enabled: enabled && Boolean(selectedProduct?.id),
  });

  const productDeviceLinks = productDevicesQuery.data ?? [];
  const selectedProductSummary = productSummaryQuery.data ?? null;
  const allDevices = devicesQuery.data ?? [];
  const displayCharms = allDevices.map<DisplayCharm>((device) => ({
    ...device,
    image: getCharmImage(device),
    link: productDeviceLinks.find((link) => link.deviceId === device.id),
  }));
  const primaryDeviceLink =
    productDeviceLinks.find((link) => link.role === "PRIMARY_SENSOR") ??
    productDeviceLinks[0] ??
    null;
  const connectedCharm =
    displayCharms.find((device) => device.id === primaryDeviceLink?.deviceId) ??
    null;
  const summaryPrimaryDevice = selectedProductSummary?.primaryDevice ?? null;
  const displayConnectedCharm = useMemo(() => {
    if (connectedCharm) {
      return connectedCharm;
    }

    if (!summaryPrimaryDevice) {
      return null;
    }

    return {
      id: summaryPrimaryDevice.deviceId,
      serialNumber: summaryPrimaryDevice.serialNumber,
      deviceName:
        summaryPrimaryDevice.deviceName ?? summaryPrimaryDevice.serialNumber,
      deviceImageUrl: summaryPrimaryDevice.deviceImageUrl ?? null,
      batteryLevel: summaryPrimaryDevice.batteryLevel ?? null,
      connectionStatus: summaryPrimaryDevice.connectionStatus ?? "DISCONNECTED",
      lastSyncedAt: summaryPrimaryDevice.lastSyncedAt ?? null,
      registeredAt: "",
      image: summaryPrimaryDevice.deviceImageUrl
        ? { uri: summaryPrimaryDevice.deviceImageUrl }
        : null,
    } satisfies DisplayCharm;
  }, [connectedCharm, summaryPrimaryDevice]);
  const lastKnownCharm =
    selectedProduct?.id != null
      ? lastCharmByProductId[selectedProduct.id]
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
    connectionStatus: displayConnectedCharm?.connectionStatus ?? "DISCONNECTED",
  } as DisplayCharm);

  useEffect(() => {
    if (pendingDeviceId !== null) return;
    setPendingDeviceId(cardCharm?.id ?? displayCharms[0]?.id ?? null);
  }, [cardCharm?.id, displayCharms, pendingDeviceId]);

  useEffect(() => {
    if (!selectedProduct || !displayConnectedCharm) return;

    setLastCharmByProductId((current) => {
      const previous = current[selectedProduct.id];

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
        [selectedProduct.id]: displayConnectedCharm,
      };
    });
  }, [displayConnectedCharm, selectedProduct?.id]);

  const visibleProducts = useMemo(() => {
    if (!selectedProduct || products.length === 0) return [];

    const previous =
      products[(selectedIndex - 1 + products.length) % products.length];
    const next = products[(selectedIndex + 1) % products.length];

    return products.length === 1
      ? [selectedProduct]
      : [previous, selectedProduct, next];
  }, [products, selectedIndex, selectedProduct]);

  const invalidateDeviceQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: deviceQueryKeys.summary }),
      queryClient.invalidateQueries({ queryKey: deviceQueryKeys.products }),
      queryClient.invalidateQueries({ queryKey: deviceQueryKeys.devices }),
      queryClient.invalidateQueries({
        queryKey: deviceQueryKeys.productDevices(selectedProduct?.id ?? null),
      }),
      queryClient.invalidateQueries({
        queryKey: deviceQueryKeys.productSummary(selectedProduct?.id ?? null),
      }),
    ]);
  };

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
    mutationFn: disconnectProductDevice,
    onSuccess: async () => {
      setDisconnectModalVisible(false);
      setCharmExpanded(false);
      setErrorMessage("");
      await invalidateDeviceQueries();
    },
    onError: (error) =>
      setErrorMessage(
        error instanceof Error ? error.message : "참 연결 해제에 실패했습니다.",
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDevice,
    onSuccess: async () => {
      setDeleteModalVisible(false);
      setPendingDeviceId(null);
      setErrorMessage("");
      await invalidateDeviceQueries();
    },
    onError: (error) =>
      setErrorMessage(
        error instanceof Error ? error.message : "참 삭제에 실패했습니다.",
      ),
  });

  const moveProduct = (direction: "prev" | "next") => {
    if (products.length === 0 || selectedIndex < 0) return;

    const offset = direction === "prev" ? -1 : 1;
    const nextIndex =
      (selectedIndex + offset + products.length) % products.length;
    setSelectedProductId(products[nextIndex].id);
    setPendingDeviceId(null);
    setCharmExpanded(false);
  };

  const handleSelectProduct = (productId: number) => {
    setSelectedProductId(productId);
    setPendingDeviceId(null);
    setCharmExpanded(false);
  };

  const handleSetPrimaryProduct = () => {
    if (!selectedProduct || isMainProduct) return;
    primaryProductMutation.mutate(selectedProduct.id);
  };

  const handleConnectCharm = () => {
    if (!selectedProduct || !pendingCharm) return;

    connectMutation.mutate({
      productId: selectedProduct.id,
      deviceId: pendingCharm.id,
    });
  };

  const confirmDeleteCharm = () => {
    if (!pendingCharm) return;
    deleteMutation.mutate(pendingCharm.id);
  };

  const confirmDisconnectCharm = () => {
    if (!selectedProduct || !pendingCharm) return;

    setLastCharmByProductId((current) => ({
      ...current,
      [selectedProduct.id]: pendingCharm,
    }));

    disconnectMutation.mutate({
      productId: selectedProduct.id,
      deviceId: pendingCharm.id,
    });
  };

  const handleAddCharm = () => {
    router.push({
      pathname: "/onboarding/charm-scan",
      params: { returnTo: "device" },
    });
  };

  const isLoading =
    productsQuery.isPending ||
    devicesQuery.isPending ||
    summaryQuery.isPending ||
    productSummaryQuery.isPending;
  const queryError =
    productsQuery.error ??
    devicesQuery.error ??
    summaryQuery.error ??
    productDevicesQuery.error ??
    productSummaryQuery.error;
  const visibleError =
    errorMessage ||
    (queryError instanceof Error ? queryError.message : "") ||
    "";

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView
        className="flex-1"
        contentContainerClassName="mx-auto w-full max-w-[390px] pb-8"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-6">
          <Text className="text-xl font-bold text-concierge-text">
            연동 및 기기관리
          </Text>
        </View>

        <View className="mt-[18px] flex-row items-center justify-between px-5">
          <Pressable onPress={() => moveProduct("prev")} hitSlop={12}>
            <Text className="text-[34px] font-light text-[#111111]">‹</Text>
          </Pressable>

          <View className="flex-1 items-center">
            <View className="flex-row items-center justify-center gap-[20px]">
              {visibleProducts.map((product) => {
                const selected = product.id === selectedProduct?.id;
                return (
                  <Pressable
                    key={product.id}
                    onPress={() => handleSelectProduct(product.id)}
                  >
                    <View
                      className="h-20 w-20 items-center justify-center"
                      style={{
                        borderRadius: 40,
                        borderWidth: 1,
                        borderColor: selected ? "#E4AB7C" : "transparent",
                      }}
                    >
                      {product.image ? (
                        <Image
                          source={product.image}
                          resizeMode="contain"
                          style={{ height: 55, width: 55 }}
                        />
                      ) : (
                        <Text className="text-[11px] font-medium text-[#898989]">
                          이미지 없음
                        </Text>
                      )}
                    </View>
                    <View
                      className="mt-[2px] h-[3px] w-[22px] self-center rounded-full"
                      style={{
                        backgroundColor: selected ? "#E4AB7C" : "transparent",
                      }}
                    />
                  </Pressable>
                );
              })}
            </View>
            <Text className="mt-1 text-[14px] font-medium text-[#6B6B6B]">
              좌우로 넘겨 가방을 선택하세요.
            </Text>
          </View>

          <Pressable onPress={() => moveProduct("next")} hitSlop={12}>
            <Text className="text-[34px] font-light text-[#111111]">›</Text>
          </Pressable>
        </View>

        <View
          className="mt-[10px] overflow-hidden self-center"
          style={{ height: 220.43, width: 388 }}
        >
          <Image
            source={heroBackground}
            style={{ height: 220.43, width: 388 }}
            resizeMode="cover"
          />
          <View className="absolute inset-0 mt-12 items-center">
            {selectedProduct?.image ? (
              <Image
                source={selectedProduct.image}
                resizeMode="contain"
                style={{ height: 178, width: 316 }}
              />
            ) : (
              <View className="h-[178px] w-[316px] items-center justify-center">
                <Text className="text-[13px] font-medium text-[#898989]">
                  제품 이미지가 없습니다.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View className="px-6 pt-6">
          {isLoading ? (
            <Text className="py-4 text-center text-[14px] text-[#6B6B6B]">
              기기 정보를 불러오고 있습니다.
            </Text>
          ) : null}

          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-[14px] font-semibold text-[#171717]">
                {selectedProduct?.productName ?? "등록된 제품이 없습니다."}
              </Text>
              <Text className="mt-[2px] text-[14px] font-medium text-[#6B6B6B]">
                {selectedProduct ? formatMaterialColor(selectedProduct) : "-"}
              </Text>
              <Text className="mt-[2px] text-[14px] font-medium text-[#232323]">
                함께한 외출{" "}
                <Text className="text-[#814C27]">
                  {formatOutingCount(
                    selectedProduct,
                    selectedProductSummary,
                    summaryQuery.data,
                  )}
                </Text>
              </Text>
            </View>
            {isMainProduct ? <Pill label="현재 메인" /> : null}
          </View>

          <Pressable
            onPress={handleSetPrimaryProduct}
            disabled={
              isMainProduct ||
              !selectedProduct ||
              primaryProductMutation.isPending
            }
            className={`mt-[18px] h-[48px] items-center justify-center rounded-[10px] ${
              isMainProduct ? "bg-[rgba(195,195,195,0.6)]" : "bg-[#814C27]"
            }`}
          >
            <Text
              className={`text-[14px] font-medium ${
                isMainProduct ? "text-[#898989]" : "text-white"
              }`}
            >
              {isMainProduct ? "현재 선택된 가방입니다." : "메인 가방으로 확정"}
            </Text>
          </Pressable>

          <View className="mt-[26px] overflow-hidden rounded-[12px] bg-white">
            <View className="min-h-[84px] flex-row items-center px-4 py-3">
              <View
                className="h-[61px] w-[61px] items-center justify-center overflow-hidden rounded-full border bg-white"
                style={{ borderColor: "#E4E1DD" }}
              >
                {cardCharm?.image ? (
                  <Image
                    source={cardCharm.image}
                    resizeMode="contain"
                    style={{ height: 52, width: 52 }}
                  />
                ) : (
                  <Text className="text-[10px] font-medium text-[#898989]">
                    참
                  </Text>
                )}
              </View>
              <View className="ml-3 flex-1">
                <View className="flex-row items-center gap-[6px]">
                  <View
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: hasConnectedCharm
                        ? "#71EBA3"
                        : "#898989",
                    }}
                  />
                  <Text className="text-[14px] font-semibold text-[#121212]">
                    {cardCharm?.serialNumber ?? "연결된 참 없음"}
                  </Text>
                </View>
                {cardCharm ? (
                  <Text className="mt-1 text-[12px] font-normal text-[#3E3E3E]">
                    배터리: {cardCharm.batteryLevel ?? "-"}%
                  </Text>
                ) : null}
              </View>
              <Pill label={hasConnectedCharm ? "연결됨" : "연결 해제됨"} />
            </View>

            <Pressable
              onPress={() => setCharmExpanded((prev) => !prev)}
              className="items-center pb-[6px]"
            >
              <Chevron expanded={charmExpanded} />
            </Pressable>

            {charmExpanded ? (
              <View className="bg-[#E4DDD5] px-[18px] pb-5 pt-2">
                <Text className="text-[16px] font-semibold text-[#121212]">
                  보유중인 참
                </Text>

                <ScrollView
                  horizontal
                  className="mt-3"
                  contentContainerStyle={{
                    gap: 19,
                    minWidth: "100%",
                    paddingRight: 4,
                  }}
                  showsHorizontalScrollIndicator={false}
                >
                  {displayCharms.map((charm) => {
                    const selected = charm.id === pendingCharm?.id;
                    const linked = charm.id === connectedDeviceId;

                    return (
                      <Pressable
                        key={charm.id}
                        onPress={() => setPendingDeviceId(charm.id)}
                        className="shrink-0 items-center"
                      >
                        <View className="h-[85px] w-[85px] items-center justify-center overflow-hidden rounded-full border border-[#898989] bg-white">
                          {charm.image ? (
                            <Image
                              source={charm.image}
                              resizeMode="contain"
                              style={{ height: 82, width: 82 }}
                            />
                          ) : (
                            <Text className="text-[12px] font-medium text-[#898989]">
                              이미지 없음
                            </Text>
                          )}
                          {selected ? (
                            <View className="absolute inset-0 items-center justify-center bg-black/35">
                              <Text className="text-[12px] font-semibold text-white">
                                선택
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text className="mt-1 text-[14px] font-semibold text-[#121212]">
                          {charm.serialNumber}
                        </Text>
                        {linked ? (
                          <View className="mt-1 rounded-[10px] bg-[#E1F7E7] px-2 py-[2px]">
                            <Text className="text-[11px] font-medium text-[#269247]">
                              연결중
                            </Text>
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}

                  <Pressable
                    onPress={handleAddCharm}
                    className="h-[85px] w-[85px] shrink-0 items-center justify-center rounded-full border border-[#898989] bg-[#C3C3C3]"
                  >
                    <Text className="text-[32px] font-light text-white">+</Text>
                  </Pressable>
                </ScrollView>

                <View className="mt-5 flex-row items-center justify-between">
                  <Text className="text-[12px] font-medium text-[#898989]">
                    선택한 참을 가방에 연결해주세요
                  </Text>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => setDeleteModalVisible(true)}
                      disabled={!pendingCharm || deleteMutation.isPending}
                      className="h-7 items-center justify-center rounded-[6px] bg-white px-3"
                    >
                      <Text className="text-[12px] font-medium text-[#A51F21]">
                        참 삭제
                      </Text>
                    </Pressable>
                    {isPendingCharmLinked ? (
                      <Pressable
                        onPress={() => setDisconnectModalVisible(true)}
                        disabled={disconnectMutation.isPending}
                        className="h-7 items-center justify-center rounded-[6px] bg-[#814C27] px-3"
                      >
                        <Text className="text-[12px] font-medium text-white">
                          연결 해제
                        </Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={handleConnectCharm}
                        disabled={
                          !pendingCharm ||
                          !selectedProduct ||
                          connectMutation.isPending
                        }
                        className="h-7 items-center justify-center rounded-[6px] bg-[#814C27] px-3"
                      >
                        <Text className="text-[12px] font-medium text-white">
                          참 연결
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            ) : null}
          </View>

          <Text className="mt-[26px] text-[18px] font-bold text-[#171717]">
            세부 기기관리
          </Text>

          <View className="mt-2 rounded-[12px] border border-[#E4E1DD] bg-white px-4 py-3">
            <Text className="text-[14px] font-medium text-[#222222]">
              현재 보관 환경
            </Text>

            <View className="mt-3 flex-row items-center">
              <View className="flex-1 items-center">
                <Text className="text-[20px] font-semibold text-[#171717]">
                  {formatTemperature(selectedProduct, selectedProductSummary)}
                </Text>
                <Text className="text-[11px] text-[#686868]">온도</Text>
              </View>
              <View className="h-10 w-px bg-[#E4E1DD]" />
              <View className="flex-1 items-center">
                <Text className="text-[20px] font-semibold text-[#171717]">
                  {formatHumidity(selectedProduct, selectedProductSummary)}
                </Text>
                <Text className="text-[11px] text-[#686868]">습도</Text>
              </View>
            </View>

            <View className="mt-3 h-px bg-[#E4E1DD]" />
            <Text className="mt-[5px] text-[12px] font-medium text-[#686868]">
              {isSameProductSummary(selectedProduct, selectedProductSummary) &&
              hasConnectedCharm
                ? "권장 범위로 유지 중이에요"
                : "데이터가 없어요"}
            </Text>
          </View>

          <View className="mt-[18px] overflow-hidden rounded-[12px] border border-[#E4E1DD] bg-white px-4">
            <View className="flex-row items-center justify-between py-[9px]">
              <View className="flex-row items-center gap-3">
                <BatteryIcon size={17} />
                <Text className="text-[14px] font-medium text-[#262626]">
                  배터리 상태
                </Text>
              </View>
              <Text className="text-[14px] font-medium text-[#262626]">
                {hasConnectedCharm
                  ? `${displayConnectedCharm?.batteryLevel ?? "-"}%`
                  : "-%"}
              </Text>
            </View>
            <View className="h-px bg-[#E4E1DD]" />
            <View className="flex-row items-center justify-between py-[9px]">
              <View className="flex-row items-center gap-3">
                <InfoIcon size={15} />
                <Text className="text-[14px] font-medium text-[#262626]">
                  마지막 연동
                </Text>
              </View>
              <Text className="text-[14px] font-medium text-[#676767]">
                {lastSyncedLabel}
              </Text>
            </View>
          </View>

          {visibleError ? (
            <Text className="mt-4 text-center text-[12px] font-medium text-[#C04737]">
              {visibleError}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <ConfirmModal
        visible={deleteModalVisible}
        title={`${pendingCharm?.serialNumber ?? "SN-0001"}을 가방에서 삭제할까요?`}
        body={
          "참을 삭제하면 현재 가방과의 연결이 해제되며\n보유 중인 참 목록에서도 삭제돼요.\n필요하면 나중에 다시 등록할 수 있어요."
        }
        confirmLabel="삭제"
        onConfirm={confirmDeleteCharm}
        onCancel={() => setDeleteModalVisible(false)}
        isPending={deleteMutation.isPending}
      />

      <ConfirmModal
        visible={disconnectModalVisible}
        title={`${pendingCharm?.serialNumber ?? "SN-0001"} 연결을 해제할까요?`}
        body="연결을 해제하면 재연결 전까지 센서 기록이 제품에 반영되지 않습니다."
        confirmLabel="연결 해제"
        onConfirm={confirmDisconnectCharm}
        onCancel={() => setDisconnectModalVisible(false)}
        isPending={disconnectMutation.isPending}
      />
    </SafeAreaView>
  );
}
