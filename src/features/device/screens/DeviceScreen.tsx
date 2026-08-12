import { useState, type ReactNode } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import deviceHeroBg from "@/features/device/assets/device-hero-bg.png";
import deviceThumb1 from "@/features/device/assets/device-thumb1.png";
import deviceThumb2 from "@/features/device/assets/device-thumb2.png";
import { DEVICE_CHARMS } from "@/features/device/constants";
import { Card } from "@/shared/components/Card";
import { BatteryIcon } from "@/shared/components/icons/BatteryIcon";
import { BellIcon } from "@/shared/components/icons/BellIcon";
import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";
import { DropletIcon } from "@/shared/components/icons/DropletIcon";
import { InfoIcon } from "@/shared/components/icons/InfoIcon";
import { PencilIcon } from "@/shared/components/icons/PencilIcon";
import { PlusIcon } from "@/shared/components/icons/PlusIcon";
import { ThermometerIcon } from "@/shared/components/icons/ThermometerIcon";

function ListRow({
  icon,
  label,
  value,
  showChevron = true
}: {
  icon: ReactNode;
  label: string;
  value: string;
  showChevron?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-row items-center gap-3">
        {icon}
        <Text className="text-sm text-[#262626]">{label}</Text>
      </View>
      <View className="flex-row items-center gap-3">
        <Text className="text-sm text-[#676767]">{value}</Text>
        {showChevron ? <ChevronRightIcon size={6} color="#999999" /> : null}
      </View>
    </View>
  );
}

export function DeviceScreen() {
  const [selectedProduct, setSelectedProduct] = useState(2);
  const [connected, setConnected] = useState(true);
  const [selectedCharmId, setSelectedCharmId] = useState(DEVICE_CHARMS[0].id);

  const handleDisconnect = () => {
    Alert.alert("Smart Charm 연결을 해제할까요?", undefined, [
      { text: "닫기", style: "cancel" },
      { text: "연결 해제", style: "destructive", onPress: () => setConnected(false) }
    ]);
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        <View className="flex-row items-center justify-between px-6 pt-4">
          <Text className="text-xl font-bold text-[#171717]">연동 및 기기관리</Text>
          <Pressable hitSlop={8}>
            <PlusIcon size={22} />
          </Pressable>
        </View>

        <View className="mt-4 flex-row gap-3 px-6">
          {[deviceThumb1, deviceThumb2, deviceHeroBg].map((thumb, index) => (
            <Pressable key={index} onPress={() => setSelectedProduct(index)}>
              <View
                className={`size-12 overflow-hidden rounded-xl ${
                  selectedProduct === index ? "border-2 border-concierge-primary" : ""
                }`}
              >
                <Image source={thumb} className="size-full" resizeMode="cover" />
              </View>
            </Pressable>
          ))}
        </View>

        <Image source={deviceHeroBg} className="mt-4 h-[184px] w-full" resizeMode="cover" />

        <View className="px-6">
          <Text className="mt-3 text-sm font-semibold text-[#171717]">MCM Aren Shopper</Text>
          <Text className="mt-1 text-xs text-[#6B6B6B]">Visetos Canvas · Black</Text>
          <Text className="mt-1 text-xs text-[#232323]">함께한 외출 50회</Text>

          <Card className="mt-4 border-0 bg-[#F6F5F2] px-4 py-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 flex-row items-center gap-2">
                <View
                  className={`size-2 rounded-full ${connected ? "bg-[#269247]" : "bg-[#B0AAA4]"}`}
                />
                <Text className="text-sm font-semibold text-[#171717]">
                  Smart Charm {connected ? "연결됨" : "연결 안 됨"}
                </Text>
              </View>
              {connected ? (
                <Pressable
                  onPress={handleDisconnect}
                  className="rounded-full border border-concierge-border px-3 py-1.5"
                >
                  <Text className="text-xs text-[#333333]">연결 해제</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => setConnected(true)}
                  className="rounded-full border border-concierge-primary px-3 py-1.5"
                >
                  <Text className="text-xs text-concierge-primary">다시 연결</Text>
                </Pressable>
              )}
            </View>
            <Text className="mt-2 text-xs text-[#3E3E3E]">배터리 65%</Text>
          </Card>

          <Card className="mt-4 border-0 px-4 py-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-concierge-text">보유중인 참</Text>
              <Pressable className="flex-row items-center gap-1">
                <PencilIcon />
                <Text className="text-xs text-[#9A5E29]">참 변경</Text>
              </Pressable>
            </View>

            <View className="mt-4 flex-row justify-between">
              {DEVICE_CHARMS.map((charm) => {
                const isSelected = charm.id === selectedCharmId;
                return (
                  <Pressable
                    key={charm.id}
                    onPress={() => setSelectedCharmId(charm.id)}
                    className="items-center"
                  >
                    <View
                      className={`size-[64px] items-center justify-center rounded-full ${
                        isSelected ? "border-2 border-concierge-primary" : "border border-concierge-borderLight"
                      }`}
                      style={{ backgroundColor: charm.color }}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          charm.id === "white" ? "text-concierge-text" : "text-white"
                        }`}
                      >
                        M
                      </Text>
                    </View>
                    <Text className="mt-2 text-sm font-semibold text-concierge-text">
                      {charm.label}
                    </Text>
                    {isSelected ? (
                      <Text className="mt-0.5 text-xs text-[#269247]">연결중</Text>
                    ) : null}
                    <Text className="mt-0.5 text-xs text-concierge-text">
                      배터리: {charm.battery}%
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable className="mt-4 self-end">
              <Text className="text-xs text-concierge-text">+ 새참 등록</Text>
            </Pressable>
          </Card>

          <Card className="mt-4 border-0 px-4 py-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-[#222222]">현재 보관 환경</Text>
              <View className="rounded-full bg-[#E7F4EC] px-2 py-1">
                <Text className="text-xs text-[#269247]">양호</Text>
              </View>
            </View>
            <View className="mt-3 flex-row items-center justify-around">
              <View className="items-center">
                <View className="flex-row items-center gap-1">
                  <ThermometerIcon size={16} />
                  <Text className="text-[11px] text-[#686868]">온도</Text>
                </View>
                <Text className="mt-1 text-xl font-semibold text-[#171717]">23°C</Text>
              </View>
              <View className="items-center">
                <View className="flex-row items-center gap-1">
                  <DropletIcon size={16} />
                  <Text className="text-[11px] text-[#686868]">습도</Text>
                </View>
                <Text className="mt-1 text-xl font-semibold text-[#171717]">48%</Text>
              </View>
            </View>
            <Text className="mt-3 text-center text-xs text-[#686868]">
              권장 범위로 유지 중이에요
            </Text>
          </Card>

          <Card className="mt-4 border-0 px-4 py-1">
            <ListRow icon={<BatteryIcon size={17} />} label="배터리 상태" value="65%" />
            <View className="border-t border-concierge-borderLight" />
            <ListRow
              icon={<InfoIcon size={14} />}
              label="마지막 연동"
              value="방금 전"
              showChevron={false}
            />
            <View className="border-t border-concierge-borderLight" />
            <ListRow icon={<BellIcon size={14} />} label="알림 설정" value="" />
            <View className="border-t border-concierge-borderLight" />
            <ListRow icon={<InfoIcon size={14} />} label="기기 정보" value="" />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
