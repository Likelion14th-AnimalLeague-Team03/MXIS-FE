import { create } from "zustand";

type DeviceState = {
  selectedProductIndex: number;
  setSelectedProductIndex: (index: number) => void;
  ownedCharmIds: string[];
  currentCharmId: string | null;
  pendingCharmId: string;
  lastSyncedAt: string | null;
  addOwnedCharm: (id: string) => void;
  deleteOwnedCharm: (id: string) => void;
  setCurrentCharmId: (id: string | null) => void;
  setPendingCharmId: (id: string) => void;
};

// "메인 가방"으로 선택된 제품 — 연동 탭 상단 선택기에서 정하면
// 케어 탭 같은 다른 화면에서도 같은 값을 참조해요.
export const useDeviceStore = create<DeviceState>((set) => ({
  selectedProductIndex: 2,
  setSelectedProductIndex: (index) => set({ selectedProductIndex: index }),
  ownedCharmIds: ["sn-0001", "sn-0022"],
  currentCharmId: "sn-0001",
  pendingCharmId: "sn-0001",
  lastSyncedAt: new Date().toISOString(),
  addOwnedCharm: (id) =>
    set((state) => {
      const ownedCharmIds = state.ownedCharmIds.includes(id)
        ? state.ownedCharmIds
        : [...state.ownedCharmIds, id];

      return {
        ownedCharmIds,
        currentCharmId: id,
        pendingCharmId: id,
        lastSyncedAt: new Date().toISOString(),
      };
    }),
  deleteOwnedCharm: (id) =>
    set((state) => {
      const ownedCharmIds = state.ownedCharmIds.filter((charmId) => charmId !== id);
      const nextPendingCharmId =
        state.pendingCharmId === id ? (ownedCharmIds[0] ?? "") : state.pendingCharmId;

      return {
        ownedCharmIds,
        currentCharmId: state.currentCharmId === id ? null : state.currentCharmId,
        pendingCharmId: nextPendingCharmId,
      };
    }),
  setCurrentCharmId: (id) =>
    set((state) => ({
      currentCharmId: id,
      lastSyncedAt: id ? new Date().toISOString() : state.lastSyncedAt,
    })),
  setPendingCharmId: (id) => set({ pendingCharmId: id }),
}));
