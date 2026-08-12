import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";
import { LogoutIcon } from "@/shared/components/icons/LogoutIcon";

const LINKS = [
  "내 정보 변경",
  "서비스 이용약관",
  "개인정보 수집·이용 약관",
  "브랜드 소식 및 마케팅 알림 약관",
];

export function MyPageScreen() {
  const handleLogout = () => {
    Alert.alert(
      "로그아웃하시겠어요?",
      "MXIS Charm은 계속 기록하지만 다시 로그인하기 전까지 데이터가 동기화되지 않을 수 있습니다.",
      [
        { text: "취소", style: "cancel" },
        { text: "로그아웃", style: "destructive" },
      ],
    );
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView className="flex-1 px-6" contentContainerClassName="pb-8">
        <Text className="mt-10 text-xl font-bold text-concierge-text">
          마이페이지
        </Text>

        <View
          className="mt-4 flex-row items-center gap-3 rounded-xl bg-concierge-surfaceMuted px-4 py-4"
          style={{
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <View className="size-11 items-center justify-center rounded-full bg-concierge-primary">
            <Text className="text-xl font-bold text-white">M</Text>
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="text-sm font-bold text-concierge-text">
              기존 MXIS 계정
            </Text>
            <Text className="text-sm text-concierge-textSecondary">
              mi***@gmail.com
            </Text>
          </View>
          <Pressable
            onPress={handleLogout}
            className="flex-row items-center gap-1"
          >
            <Text className="text-[11px] text-[#757575]">로그아웃</Text>
            <LogoutIcon size={12} color="#757575" />
          </Pressable>
        </View>

        <View className="-mx-6 mt-[11px] border-t border-concierge-borderLight" />

        <View className="mt-[20px] px-3 max-w-[335px]">
          {LINKS.map((label, index) => (
            <View key={label}>
              <Pressable className="flex-row items-center justify-between py-2">
                <Text className="text-sm text-concierge-textSecondary">
                  {label}
                </Text>
                <ChevronRightIcon size={6} color="#63635E" />
              </Pressable>
              {index < LINKS.length - 1 ? (
                <View className="border-t border-concierge-borderLight" />
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
