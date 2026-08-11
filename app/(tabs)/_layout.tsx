import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "홈" }} />
      <Tabs.Screen name="reservation" options={{ title: "예약" }} />
      <Tabs.Screen name="status" options={{ title: "상태" }} />
      <Tabs.Screen name="care" options={{ title: "케어" }} />
      <Tabs.Screen name="mypage" options={{ title: "마이페이지" }} />
    </Tabs>
  );
}
