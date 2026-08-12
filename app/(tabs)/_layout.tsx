import { Tabs } from "expo-router";

import {
  CareTabIcon,
  DeviceTabIcon,
  HomeTabIcon,
  MyPageTabIcon,
  ReservationTabIcon,
} from "@/shared/components/icons/tabs/TabBarIcons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#111111",
        tabBarInactiveTintColor: "rgba(17,17,17,0.4)",
      }}
    >
      <Tabs.Screen
        name="reservation"
        options={{
          title: "예약",
          tabBarIcon: ({ color }) => (
            <ReservationTabIcon color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="device"
        options={{
          title: "연동",
          tabBarIcon: ({ color }) => <DeviceTabIcon color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          tabBarIcon: ({ color }) => <HomeTabIcon color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="care"
        options={{
          title: "케어",
          tabBarIcon: ({ color }) => <CareTabIcon color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="mypage"
        options={{
          title: "마이페이지",
          tabBarIcon: ({ color }) => <MyPageTabIcon color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}
