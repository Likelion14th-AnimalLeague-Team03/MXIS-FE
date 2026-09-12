import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store/authStore";
import {
  getConsents,
  getMyProfile,
  getNotificationSettings,
  updateConsents,
  updateNotificationSettings,
} from "@/features/mypage/api/mypageApi";
import { myPageQueryKeys } from "@/features/mypage/queryKeys";
import type {
  ConsentItem,
  ConsentStatus,
  NotificationSetting,
  NotificationSettingUpdate,
} from "@/features/mypage/types";

export function useMyProfile() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: myPageQueryKeys.profile,
    queryFn: getMyProfile,
    enabled: Boolean(accessToken),
    staleTime: 5 * 60 * 1000,
  });
}

export function useNotificationSettings() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: myPageQueryKeys.notificationSettings,
    queryFn: getNotificationSettings,
    enabled: Boolean(accessToken),
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: NotificationSettingUpdate) =>
      updateNotificationSettings(request),
    // 스위치는 눌렀을 때 바로 움직여야 자연스러워서 낙관적 업데이트를 쓰고,
    // 실패하면 이전 값으로 되돌려요.
    onMutate: async (request) => {
      await queryClient.cancelQueries({
        queryKey: myPageQueryKeys.notificationSettings,
      });

      const previous = queryClient.getQueryData<NotificationSetting>(
        myPageQueryKeys.notificationSettings,
      );

      if (previous) {
        queryClient.setQueryData<NotificationSetting>(
          myPageQueryKeys.notificationSettings,
          { ...previous, ...request },
        );
      }

      return { previous };
    },
    onError: (_error, _request, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          myPageQueryKeys.notificationSettings,
          context.previous,
        );
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(myPageQueryKeys.notificationSettings, data);
    },
  });
}

export function useConsents() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: myPageQueryKeys.consents,
    queryFn: getConsents,
    enabled: Boolean(accessToken),
  });
}

export function useUpdateConsents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (consents: ConsentItem[]) => updateConsents(consents),
    onSuccess: (data: ConsentStatus[]) => {
      queryClient.setQueryData(myPageQueryKeys.consents, data);
    },
  });
}
