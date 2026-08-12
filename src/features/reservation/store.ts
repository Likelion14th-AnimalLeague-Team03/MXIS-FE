import { create } from "zustand";

import type { ConfirmedReservation, ReservationDraft } from "@/features/reservation/types";

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
  setDraftStore: (name: string, address: string) => void;
  setDraftDateTime: (date: Date, time: string) => void;
  setDraftNote: (note: string) => void;
  resetDraft: () => void;
  confirmDraft: () => void;
  updateConfirmedDateTime: (date: Date, time: string) => void;
  cancelReservation: () => void;
};

export const useReservationStore = create<ReservationState>((set, get) => ({
  draft: EMPTY_DRAFT,
  confirmed: null,
  setDraftStore: (name, address) =>
    set((state) => ({ draft: { ...state.draft, storeName: name, storeAddress: address } })),
  setDraftDateTime: (date, time) => set((state) => ({ draft: { ...state.draft, date, time } })),
  setDraftNote: (note) => set((state) => ({ draft: { ...state.draft, note } })),
  resetDraft: () => set({ draft: EMPTY_DRAFT }),
  confirmDraft: () => {
    const { draft } = get();
    if (!draft.storeName || !draft.storeAddress || !draft.date || !draft.time) return;

    set({
      confirmed: {
        productName: "MCM Aren Shopper",
        storeName: draft.storeName,
        storeAddress: draft.storeAddress,
        serviceName: "케어 컨시어지 · 가죽 클리닝",
        date: draft.date,
        time: draft.time,
        note: draft.note
      },
      draft: EMPTY_DRAFT
    });
  },
  updateConfirmedDateTime: (date, time) =>
    set((state) => (state.confirmed ? { confirmed: { ...state.confirmed, date, time } } : {})),
  cancelReservation: () => set({ confirmed: null })
}));
