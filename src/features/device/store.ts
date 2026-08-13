import { create } from "zustand";

type DeviceState = {
  selectedProductIndex: number;
  setSelectedProductIndex: (index: number) => void;
};

// "메인 가방"으로 선택된 제품 — 연동 탭 상단 선택기에서 정하면
// 케어 탭 같은 다른 화면에서도 같은 값을 참조해요.
export const useDeviceStore = create<DeviceState>((set) => ({
  selectedProductIndex: 2,
  setSelectedProductIndex: (index) => set({ selectedProductIndex: index })
}));
