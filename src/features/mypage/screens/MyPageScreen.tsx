import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";

const LINKS = ["내 정보 변경", "서비스 이용약관", "개인정보 수집·이용 약관", "브랜드 소식 및 마케팅 알림 약관"];

export function MyPageScreen() {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView className="flex-1 px-6" contentContainerClassName="pb-8">
        <Text className="mt-4 text-xl font-bold text-concierge-text">마이페이지</Text>

        <View className="mt-4 flex-row items-center gap-3 rounded-xl bg-concierge-surfaceMuted px-4 py-4">
          <View className="size-11 items-center justify-center rounded-full bg-concierge-primary">
            <Text className="text-xl font-bold text-white">M</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-concierge-text">기존 MXIS 계정</Text>
            <Text className="text-sm text-concierge-textSecondary">mi***@gmail.com</Text>
          </View>
          <Pressable>
            <Text className="text-[11px] text-[#757575]">로그아웃</Text>
          </Pressable>
        </View>

        <View className="mt-6">
          {LINKS.map((label, index) => (
            <View key={label}>
              <Pressable className="flex-row items-center justify-between py-3.5">
                <Text className="text-sm text-concierge-textSecondary">{label}</Text>
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
