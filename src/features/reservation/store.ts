import { create } from "zustand";

import type {
  ConfirmedReservation,
  ReservationCareType,
  ReservationDraft,
  ReservationStatus,
} from "@/features/reservation/types";

const EMPTY_DRAFT: ReservationDraft = {
  storeName: null,
  storeAddress: null,
  date: null,
  time: null,
  note: ""
};

type ReservationState = {
  draft: ReservationDraft;
  confirmed: ConfirmedReservation | null;
  // 예약 입력 화면에 들어가기 전에 무상/유상 중 어떤 흐름으로 예약하는지 정해둬요.
  // 무상 케어(선물 배너에서 진입)는 예약 즉시 확정, 유상 케어는 매장 승인 대기를 거칩니다.
  pendingCareType: ReservationCareType;
  setDraftStore: (name: string, address: string) => void;
  setDraftDateTime: (date: Date, time: string) => void;
  setDraftNote: (note: string) => void;
  resetDraft: () => void;
  setPendingCareType: (careType: ReservationCareType) => void;
  confirmDraft: () => void;
  updateConfirmedDateTime: (date: Date, time: string) => void;
  cancelReservation: () => void;
  approveReservation: () => void;
};

export const useReservationStore = create<ReservationState>((set, get) => ({
  draft: EMPTY_DRAFT,
  confirmed: null,
  pendingCareType: "PAID",
  setDraftStore: (name, address) =>
    set((state) => ({ draft: { ...state.draft, storeName: name, storeAddress: address } })),
  setDraftDateTime: (date, time) => set((state) => ({ draft: { ...state.draft, date, time } })),
  setDraftNote: (note) => set((state) => ({ draft: { ...state.draft, note } })),
  resetDraft: () => set({ draft: EMPTY_DRAFT }),
  setPendingCareType: (careType) => set({ pendingCareType: careType }),
  confirmDraft: () => {
    const { draft, pendingCareType } = get();
    if (!draft.storeName || !draft.storeAddress || !draft.date || !draft.time) return;

    const status: ReservationStatus = pendingCareType === "FREE" ? "CONFIRMED" : "PENDING";

    set({
      confirmed: {
        productName: "Ella 바세토스 보스턴 백",
        storeName: draft.storeName,
        storeAddress: draft.storeAddress,
        serviceName: "제품 컨디션 점검",
        date: draft.date,
        time: draft.time,
        note: draft.note,
        careType: pendingCareType,
        status
      },
      draft: EMPTY_DRAFT,
      pendingCareType: "PAID"
    });
  },
  updateConfirmedDateTime: (date, time) =>
    set((state) => (state.confirmed ? { confirmed: { ...state.confirmed, date, time } } : {})),
  cancelReservation: () => set({ confirmed: null }),
  approveReservation: () =>
    set((state) =>
      state.confirmed ? { confirmed: { ...state.confirmed, status: "CONFIRMED" } } : {}
    )
}));
