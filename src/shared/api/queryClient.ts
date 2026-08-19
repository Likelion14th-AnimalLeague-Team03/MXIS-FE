import { QueryClient } from "@tanstack/react-query";

/**
 * 앱 전체가 공유하는 QueryClient.
 * 계정이 바뀔 때 캐시를 비워야 해서 Provider 밖에서도 접근할 수 있게 모듈 스코프에 둡니다.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 401은 인터셉터가 토큰 재발급으로 한 번 처리하니, 여기서는 재시도를 짧게 둡니다.
      retry: 1,
      staleTime: 30 * 1000,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * 로그인·로그아웃 시 이전 사용자의 응답이 남지 않도록 캐시를 전부 비웁니다.
 * (프로필처럼 staleTime이 긴 쿼리는 캐시가 남아 있으면 재조회 없이 옛 데이터를 그대로 보여줘요.)
 */
export function resetQueryCache() {
  queryClient.clear();
}
