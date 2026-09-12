import type { ImageSourcePropType } from "react-native";

import type { Product } from "@/features/product/types";

type UnknownDeviceValue = string & {};

export type DeviceConnectionStatus =
  | "CONNECTED"
  | "DISCONNECTED"
  | "SYNCING"
  | "ERROR"
  | UnknownDeviceValue;

export type ProductDeviceRole =
  | "PRIMARY_SENSOR"
  | "SECONDARY"
  | UnknownDeviceValue;

export type Device = {
  id: number;
  serialNumber: string;
  deviceName: string;
  macAddress?: string | null;
  firmwareVersion?: string | null;
  deviceImageUrl?: string | null;
  batteryLevel?: number | null;
  connectionStatus: DeviceConnectionStatus;
  lastSyncedAt?: string | null;
  registeredAt: string;
};

export type ProductDeviceLink = {
  id: number;
  deviceId: number;
  serialNumber: string;
  deviceName: string;
  role: ProductDeviceRole;
  attachedAt: string;
  detachedAt?: string | null;
};

type ManagedDeviceSummary = {
  deviceId: number;
  serialNumber: string;
  deviceName?: string | null;
  deviceImageUrl?: string | null;
  connectionStatus?: DeviceConnectionStatus | null;
  batteryLevel?: number | null;
  lastSyncedAt?: string | null;
};

type CurrentEnvironment = {
  temperature?: number | null;
  humidity?: number | null;
  measuredAt?: string | null;
};

export type DeviceManagementSummary = {
  products: Array<{
    productId: number;
    productImageUrl?: string | null;
  }>;
  primaryProduct: {
    productId: number;
    productImageUrl?: string | null;
    productName: string;
    materialId?: string | null;
    materialDisplayName?: string | null;
    color?: string | null;
    modelCode?: string | null;
    dppCode?: string | null;
  } | null;
  totalOutingCount: number | null;
  primaryDevice: ManagedDeviceSummary | null;
  currentEnvironment: CurrentEnvironment | null;
};

export type ProductDeviceManagementSummary = {
  product: {
    productId?: number;
    id?: number;
    productImageUrl?: string | null;
    productName: string;
    materialId?: string | null;
    materialDisplayName?: string | null;
    materialName?: string | null;
    color?: string | null;
    modelCode?: string | null;
    dppCode?: string | null;
    productCode?: string | null;
    isPrimary?: boolean;
    primary?: boolean;
  } | null;
  currentEnvironment: CurrentEnvironment | null;
  totalOutingCount: number | null;
  primaryDevice: ManagedDeviceSummary | null;
  connectedDevices?: Array<
    ManagedDeviceSummary & { role?: ProductDeviceRole }
  > | null;
  outingCount?: number | string | null;
  totalOutings?: number | string | null;
  totalOutingSessions?: number | string | null;
};

export type DeviceProduct = Product & {
  image: ImageSourcePropType | null;
};

export type DisplayCharm = Device & {
  image: ImageSourcePropType | null;
  link?: ProductDeviceLink;
};
