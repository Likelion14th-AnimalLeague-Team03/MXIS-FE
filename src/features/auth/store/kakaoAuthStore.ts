import { create } from "zustand";

import type { KakaoProfileDraft } from "@/features/auth/types";

type KakaoAuthState = {
  draft: KakaoProfileDraft | null;
  setDraft: (draft: KakaoProfileDraft) => void;
  updatePhone: (phone: string) => void;
  clearDraft: () => void;
};

export const useKakaoAuthStore = create<KakaoAuthState>((set) => ({
  draft: null,

  setDraft: (draft) => set({ draft }),

  updatePhone: (phone) =>
    set((state) => ({
      draft: state.draft ? { ...state.draft, phone } : state.draft,
    })),

  clearDraft: () => set({ draft: null }),
}));
