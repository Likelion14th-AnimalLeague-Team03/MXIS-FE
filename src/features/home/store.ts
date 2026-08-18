import { create } from "zustand";

type HomePromptState = {
  /**
   * Charm 재연결 안내 모달을 이미 띄웠는지 여부.
   * 홈 화면이 탭 이동으로 다시 마운트돼도 반복해서 뜨지 않도록 화면 밖(스토어)에 둡니다.
   * 다시 연결되면 초기화해서, 다음에 끊겼을 때 한 번 더 안내해요.
   */
  reconnectPromptShown: boolean;
  markReconnectPromptShown: () => void;
  resetReconnectPrompt: () => void;
};

export const useHomePromptStore = create<HomePromptState>((set) => ({
  reconnectPromptShown: false,
  markReconnectPromptShown: () => set({ reconnectPromptShown: true }),
  resetReconnectPrompt: () => set({ reconnectPromptShown: false }),
}));
