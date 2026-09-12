import type { ImageSourcePropType } from "react-native";

import type {
  Device,
  DeviceManagementSummary,
  ProductDeviceManagementSummary,
  DisplayCharm,
} from "@/features/device/types";
import type { Product } from "@/features/product/types";

export function getProductImage(product: Product): ImageSourcePropType | null {
  if (product.productImageUrl) {
    return { uri: product.productImageUrl };
  }

  return null;
}

export function getCharmImage(device: Device): ImageSourcePropType | null {
  if (device.deviceImageUrl) {
    return { uri: device.deviceImageUrl };
  }

  return null;
}

export function isSameProduct(
  product: Product | null,
  summary?: DeviceManagementSummary | null,
) {
  return Boolean(
    product &&
      summary?.primaryProduct &&
      product.id === summary.primaryProduct.productId,
  );
}

export function getProductSummaryProductId(
  summary?: ProductDeviceManagementSummary | null,
) {
  return summary?.product?.productId ?? summary?.product?.id ?? null;
}

export function isSameProductSummary(
  product: Product | null,
  summary?: ProductDeviceManagementSummary | null,
) {
  return Boolean(product && product.id === getProductSummaryProductId(summary));
}

export function formatMaterialColor(product: Product) {
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

export function formatOutingCount(
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

export function formatTemperature(
  product: Product | null,
  summary?: ProductDeviceManagementSummary | null,
  hasConnectedCharm?: boolean,
) {
  if (
    !hasConnectedCharm ||
    !isSameProductSummary(product, summary) ||
    summary?.currentEnvironment == null
  ) {
    return "-℃";
  }

  const value = summary.currentEnvironment.temperature;
  return typeof value === "number" ? `${Math.round(value)}℃` : "-℃";
}

export function formatHumidity(
  product: Product | null,
  summary?: ProductDeviceManagementSummary | null,
  hasConnectedCharm?: boolean,
) {
  if (
    !hasConnectedCharm ||
    !isSameProductSummary(product, summary) ||
    summary?.currentEnvironment == null
  ) {
    return "-%";
  }

  const value = summary.currentEnvironment.humidity;
  return typeof value === "number" ? `${Math.round(value)}%` : "-%";
}

export function formatLastSyncedAt(device: Pick<DisplayCharm, "lastSyncedAt"> | null) {
  if (!device) return "-";
  if (!device.lastSyncedAt) return "-";

  const syncedAt = new Date(device.lastSyncedAt).getTime();
  if (Number.isNaN(syncedAt)) return "-";

  const diffMs = Math.max(0, Date.now() - syncedAt);
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));

  if (diffHours < 1) return "방금 전";
  if (diffHours < 24) return `${diffHours}시간 전`;

  const date = new Date(device.lastSyncedAt);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function formatBatteryLabel(device: DisplayCharm | null) {
  if (!device) return "-%";
  if (device.serialNumber.startsWith("SC-OB-")) return "미지원";

  return `${device.batteryLevel ?? "-"}%`;
}
