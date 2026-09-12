import type { Device as BleDevice } from "react-native-ble-plx";

export type CharmConnectionStatus =
  | "idle"
  | "ble-connecting"
  | "service-discovering"
  | "notify-subscribing"
  | "ping-checking"
  | "device-verifying"
  | "syncing"
  | "registering"
  | "ble-failed"
  | "setup-failed"
  | "server-failed";

export type CharmScanResult = "scanning" | "found" | "empty";

export type ScannedCharmDevice = {
  id: string;
  name: string;
  serialNumber: string;
  macAddress?: string;
  serviceUUIDs: string[];
  status: CharmConnectionStatus;
  errorMessage?: string;
  bleDevice: BleDevice;
};

export type OnboardingProduct = {
  id: string;
  productId: number;
  name: string;
  material: string;
  color: string;
  productCode: string;
  modelCode?: string;
  productImageUrl?: string | null;
};
