export type Charm = {
  id: string;
  label: string;
  color: string;
  battery: number;
};

export const DEVICE_CHARMS: Charm[] = [
  { id: "white", label: "white", color: "#F5F3EF", battery: 65 },
  { id: "black", label: "black", color: "#1C1C1C", battery: 82 },
  { id: "cognac", label: "cognac", color: "#9A5E29", battery: 70 }
];
