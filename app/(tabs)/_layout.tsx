import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  CareTabIcon,
  DeviceTabIcon,
  HomeTabIcon,
  MyPageTabIcon,
  ReservationTabIcon,
} from "@/shared/components/icons/tabs/TabBarIcons";

const TAB_ICON_SIZE = 22;
/** 아이콘이 차지할 정사각 영역 — 아이콘별 여백 차이와 무관하게 같은 위치에 놓이게 해줘요. */
const TAB_ICON_BOX = 26;
const TAB_BAR_CONTENT_HEIGHT = 56;

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#111111",
        tabBarInactiveTintColor: "rgba(17,17,17,0.4)",
        // 안드로이드/iOS/웹의 기본 탭 바 높이와 여백이 서로 달라서 직접 고정합니다.
        tabBarStyle: {
          height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom,
        },
        tabBarIconStyle: {
          width: TAB_ICON_BOX,
          height: TAB_ICON_BOX,
          alignItems: "center",
          justifyContent: "center",
        },
        tabBarItemStyle: {
          paddingTop: 0,
          paddingBottom: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          lineHeight: 14,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="reservation"
        options={{
          title: "예약",
          tabBarIcon: ({ color }) => (
            <ReservationTabIcon color={color} size={TAB_ICON_SIZE} />
          ),
        }}
      />
      <Tabs.Screen
        name="device"
        options={{
          title: "연동",
          tabBarIcon: ({ color }) => (
            <DeviceTabIcon color={color} size={TAB_ICON_SIZE} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          tabBarIcon: ({ color }) => (
            <HomeTabIcon color={color} size={TAB_ICON_SIZE} />
          ),
        }}
      />
      <Tabs.Screen
        name="care"
        options={{
          title: "케어",
          tabBarIcon: ({ color }) => (
            <CareTabIcon color={color} size={TAB_ICON_SIZE} />
          ),
        }}
      />
      <Tabs.Screen
        name="mypage"
        options={{
          title: "마이페이지",
          tabBarIcon: ({ color }) => (
            <MyPageTabIcon color={color} size={TAB_ICON_SIZE} />
          ),
        }}
      />
    </Tabs>
  );
}
