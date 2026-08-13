import { useState, type ReactNode } from "react";
import {
  Image,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import deviceHeroBg from "@/features/device/assets/device-hero-bg.png";
import {
  CONNECTED_CHARM_ID,
  DEVICE_CHARMS,
  NOTIFICATION_SETTINGS,
  PRODUCTS,
} from "@/features/device/constants";
import { useDeviceStore } from "@/features/device/store";
import { Card } from "@/shared/components/Card";
import { BatteryIcon } from "@/shared/components/icons/BatteryIcon";
import { BellIcon } from "@/shared/components/icons/BellIcon";
import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";
import { DropletIcon } from "@/shared/components/icons/DropletIcon";
import { InfoIcon } from "@/shared/components/icons/InfoIcon";
import { PlusIcon } from "@/shared/components/icons/PlusIcon";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { SecondaryButton } from "@/shared/components/SecondaryButton";
import { ThermometerIcon } from "@/shared/components/icons/ThermometerIcon";
import { colors } from "@/shared/styles/colors";

// Android에서 LayoutAnimation을 활성화하기 위한 설정
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function ListRow({
  icon,
  label,
  value,
  showChevron = true,
  chevronRotated = false,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  showChevron?: boolean;
  chevronRotated?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center justify-between py-3"
    >
      <View className="flex-row items-center gap-3">
        {icon}
        <Text className="text-sm text-[#262626]">{label}</Text>
      </View>
      <View className="flex-row items-center gap-3">
        <Text className="text-sm text-[#676767]">{value}</Text>
        {showChevron ? (
          <View
            style={{
              transform: [{ rotate: chevronRotated ? "-90deg" : "90deg" }],
            }}
          >
            <ChevronRightIcon size={6} color="#999999" />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export function DeviceScreen() {
  const selectedProduct = useDeviceStore((state) => state.selectedProductIndex);
  const setSelectedProduct = useDeviceStore((state) => state.setSelectedProductIndex);
  const [connected, setConnected] = useState(true);
  const [charmListExpanded, setCharmListExpanded] = useState(false);
  const [notificationsExpanded, setNotificationsExpanded] = useState(false);
  const [disconnectModalVisible, setDisconnectModalVisible] = useState(false);
  const [connectedCharmId, setConnectedCharmId] = useState(CONNECTED_CHARM_ID);
  const [pendingCharmId, setPendingCharmId] = useState<string | null>(null);
  const [notificationToggles, setNotificationToggles] = useState<
    Record<string, boolean>
  >(
    Object.fromEntries(
      NOTIFICATION_SETTINGS.map((item) => [item.key, item.defaultValue]),
    ),
  );

  // 부드러운 펼침/접힘 토글 함수
  const toggleCharmList = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCharmListExpanded((prev) => !prev);
  };

  const toggleNotifications = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNotificationsExpanded((prev) => !prev);
  };

  const confirmDisconnect = () => {
    setConnected(false);
    setDisconnectModalVisible(false);
  };

  const handleChangeCharm = () => {
    if (!pendingCharmId) return;
    setConnectedCharmId(pendingCharmId);
    setPendingCharmId(null);
  };

  const connectedCharm =
    DEVICE_CHARMS.find((charm) => charm.id === connectedCharmId) ??
    DEVICE_CHARMS[0];

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        <View className="flex-row items-center justify-between px-6 pt-4">
          <Text className="text-xl font-bold text-[#171717]">
            연동 및 기기관리
          </Text>
          <Pressable hitSlop={8}>
            <PlusIcon size={22} />
          </Pressable>
        </View>

        <View className="mt-4 flex-row gap-3 px-6">
          {PRODUCTS.map((product, index) => (
            <Pressable key={product.id} onPress={() => setSelectedProduct(index)}>
              <View
                className={`size-12 overflow-hidden rounded-full border-2 ${
                  selectedProduct === index
                    ? "border-concierge-primary"
                    : "border-transparent"
                }`}
              >
                <Image
                  source={product.image}
                  className="size-full"
                  resizeMode="cover"
                />
              </View>
              <View
                className="mt-1.5 h-[3px] w-6 self-center rounded-full"
                style={{
                  backgroundColor:
                    selectedProduct === index ? colors.primary : "transparent",
                }}
              />
            </Pressable>
          ))}
        </View>

        <View className="mt-4 h-[184px] w-full overflow-hidden">
          <Image
            source={deviceHeroBg}
            className="size-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 items-center justify-center p-8">
            <Image
              source={PRODUCTS[selectedProduct].image}
              className="size-full"
              resizeMode="contain"
            />
          </View>
        </View>

        <View className="px-6">
          <Text className="mt-3 text-sm font-semibold text-[#171717]">
            {PRODUCTS[selectedProduct].name}
          </Text>
          <Text className="mt-1 text-xs text-[#6B6B6B]">
            {PRODUCTS[selectedProduct].variant}
          </Text>
          <Text className="mt-1 text-xs text-[#232323]">함께한 외출 50회</Text>

          {/* Smart Charm 메인 카드 */}
          <View className="mt-4 overflow-hidden rounded-2xl border border-[#E0E0E0] bg-white">
            <View className="px-4 py-3">
              <View className="flex-row items-start gap-3">
                <View className="size-[64px] overflow-hidden rounded-full border border-concierge-borderLight">
                  <Image
                    source={connectedCharm.image}
                    className="size-full"
                    resizeMode="cover"
                  />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 flex-row items-center gap-2">
                      <View
                        className={`size-2 rounded-full ${connected ? "bg-[#71EBA3]" : "bg-[#B0AAA4]"}`}
                      />
                      <Text className="text-sm font-semibold text-[#171717]">
                        Smart Charm {connected ? "연결됨" : "연결 안 됨"}
                      </Text>
                    </View>
                    {connected ? (
                      <Pressable
                        onPress={() => setDisconnectModalVisible(true)}
                        className="rounded-full bg-[#FFE8E8] px-3 py-1"
                      >
                        <Text className="text-xs ">연결 해제</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => setConnected(true)}
                        className="rounded-full border border-concierge-primary px-3 py-1.5"
                      >
                        <Text className="text-xs text-concierge-primary">
                          다시 연결
                        </Text>
                      </Pressable>
                    )}
                  </View>
                  <Text className="mt-2 text-xs text-[#3E3E3E]">배터리</Text>
                  <Text className="text-xs text-[#3E3E3E]">
                    {connectedCharm.battery}%
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={toggleCharmList}
                hitSlop={8}
                className="mt-2 items-center"
              >
                <Text className="text-xs text-[#999999]">
                  {charmListExpanded ? "︿" : "﹀"}
                </Text>
              </Pressable>
            </View>

            {/* 참 리스트 (펼쳐지는 하단 컨테이너) */}
            {charmListExpanded ? (
              <View className="bg-[#E4DDD5] px-4 py-4">
                <Text className="text-base font-semibold text-concierge-text">
                  보유중인 참
                </Text>

                <View className="mt-4 flex-row justify-between">
                  {DEVICE_CHARMS.map((charm) => {
                    const isDesignated = charm.id === connectedCharmId;
                    const isConnected = connected && isDesignated;
                    const isPending = charm.id === pendingCharmId;
                    return (
                      <Pressable
                        key={charm.id}
                        className="items-center"
                        disabled={isDesignated}
                        onPress={() => setPendingCharmId(charm.id)}
                      >
                        <View
                          className={`size-[85px] overflow-hidden rounded-full bg-white ${
                            isDesignated
                              ? "border-2 border-concierge-primary"
                              : "border border-concierge-borderLight"
                          }`}
                        >
                          <Image
                            source={charm.image}
                            className="size-full"
                            resizeMode="cover"
                          />
                          {isPending ? (
                            <View className="absolute inset-0 items-center justify-center bg-black/50">
                              <Text className="text-xs font-semibold text-white">
                                선택
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text className="mt-2 text-sm font-semibold text-concierge-text">
                          {charm.label}
                        </Text>
                        <Text className="mt-0.5 text-xs text-concierge-text">
                          배터리: {charm.battery}%
                        </Text>
                        {isConnected ? (
                          <View className="mt-1 rounded-[10px] bg-[#E1F7E7] px-2 py-0.5">
                            <Text className="text-xs text-[#269247]">
                              연결중
                            </Text>
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>

                <View className="mt-4 flex-row items-center justify-end gap-4">
                  <Pressable>
                    <Text className="text-sm text-concierge-text">
                      + 새참 등록
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleChangeCharm}
                    disabled={!pendingCharmId}
                  >
                    <Text
                      className={`border px-3 py-1 rounded-[5px] text-sm ${pendingCharmId ? "text-concierge-primary border-concierge-primary " : "text-concierge-textMuted border-concierge-textMuted"}`}
                    >
                      참 변경
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>

          <Text className="mt-4 text-[18px] font-semibold ">세부 기기관리</Text>

          <Card className="mt-2 border-0 bg-white px-4 py-4">
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
                <Text className="mt-1 text-xl font-semibold text-[#171717]">
                  23°C
                </Text>
              </View>
              <View className="h-10 w-px bg-concierge-borderLight" />
              <View className="items-center">
                <View className="flex-row items-center gap-1">
                  <DropletIcon size={16} />
                  <Text className="text-[11px] text-[#686868]">습도</Text>
                </View>
                <Text className="mt-1 text-xl font-semibold text-[#171717]">
                  48%
                </Text>
              </View>
            </View>
            <Text className="mt-3 text-center text-xs text-[#686868]">
              권장 범위로 유지 중이에요
            </Text>
          </Card>

          <View className="mt-4 overflow-hidden rounded-xl border border-concierge-borderLight">
            <View className="bg-white px-4 py-1">
              <ListRow
                icon={<BatteryIcon size={17} />}
                label="배터리 상태"
                value="65%"
                showChevron={false}
              />
              <View className="border-t border-concierge-borderLight" />
              <ListRow
                icon={<InfoIcon size={14} />}
                label="마지막 연동"
                value="방금 전"
                showChevron={false}
              />
              <View className="border-t border-concierge-borderLight" />
              <ListRow
                icon={<BellIcon size={14} />}
                label="알림 설정"
                value=""
                chevronRotated={notificationsExpanded}
                onPress={toggleNotifications}
              />
            </View>

            {notificationsExpanded ? (
              <View className="gap-1 bg-[#E4DDD5] px-4 pb-3 pt-1">
                {NOTIFICATION_SETTINGS.map((item) => (
                  <View
                    key={item.key}
                    className="flex-row items-center justify-between py-1.5 pl-[29px]"
                  >
                    <Text className="text-sm text-[#262626]">{item.label}</Text>
                    <Switch
                      value={notificationToggles[item.key]}
                      onValueChange={(value) =>
                        setNotificationToggles((prev) => ({
                          ...prev,
                          [item.key]: value,
                        }))
                      }
                      trackColor={{ false: "#898989", true: "#4EC576" }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={disconnectModalVisible}
        animationType="fade"
        onRequestClose={() => setDisconnectModalVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full rounded-2xl bg-white p-5">
            <Text className="text-lg font-bold text-concierge-text">
              MXIS Charm 연결을 해제할까요?
            </Text>
            <Text className="mt-2 text-sm text-concierge-textSecondary">
              연결을 해제하면 새로운 센서 기록이 제품에 반영되지 않습니다. 기존
              기록은 안전하게 유지됩니다.
            </Text>
            <PrimaryButton
              label="연결 해제"
              onPress={confirmDisconnect}
              className="mt-4"
            />
            <SecondaryButton
              label="취소"
              onPress={() => setDisconnectModalVisible(false)}
              className="mt-2"
            />
            <Text className="mt-3 text-center text-xs text-concierge-textMuted">
              기존 기록은 삭제되지 않습니다.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
