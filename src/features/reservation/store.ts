import { create } from "zustand";

import type { ReservationDraft, ReservationType } from "@/features/reservation/types";

const EMPTY_DRAFT: ReservationDraft = {
  storeId: null,
  storeName: null,
  storeAddress: null,
  date: null,
  time: null,
  note: "",
};

type ReservationState = {
  /** 예약 요청 전까지만 로컬에 들고 있는 입력값 — 확정된 예약은 서버(GET /reservations)가 원본이에요. */
  draft: ReservationDraft;
  // 예약 입력 화면에 들어가기 전에 무상/유상 중 어떤 흐름으로 예약하는지 정해둬요.
  // 서버 ReservationCreateRequest.reservationType으로 그대로 전달됩니다.
  pendingCareType: ReservationType;
  setDraftStore: (store: {
    id: number;
    name: string;
    address: string | null;
  }) => void;
  setDraftDateTime: (date: Date, time: string) => void;
  setDraftNote: (note: string) => void;
  resetDraft: () => void;
  setPendingCareType: (careType: ReservationType) => void;
};

export const useReservationStore = create<ReservationState>((set) => ({
  draft: EMPTY_DRAFT,
  pendingCareType: "PAID",
  setDraftStore: (store) =>
    set((state) => {
      // 매장이 바뀌면 이전 매장 기준으로 고른 시간은 무효라서 비우고,
      // 같은 매장을 다시 고른 경우엔 이미 선택한 일정을 유지해요.
      const isSameStore = state.draft.storeId === store.id;

      return {
        draft: {
          ...state.draft,
          storeId: store.id,
          storeName: store.name,
          storeAddress: store.address,
          date: isSameStore ? state.draft.date : null,
          time: isSameStore ? state.draft.time : null,
        },
      };
    }),
  setDraftDateTime: (date, time) =>
    set((state) => ({ draft: { ...state.draft, date, time } })),
  setDraftNote: (note) => set((state) => ({ draft: { ...state.draft, note } })),
  resetDraft: () => set({ draft: EMPTY_DRAFT }),
  setPendingCareType: (careType) => set({ pendingCareType: careType }),
}));
