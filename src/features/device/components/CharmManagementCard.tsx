import { Image, Pressable, Text, View } from "react-native";

import {
  CharmConnectionPill,
  Chevron,
} from "@/features/device/components/DeviceBadges";
import type { DisplayCharm } from "@/features/device/types";
import { formatBatteryLabel } from "@/features/device/utils/deviceDisplay";
import { PlusIcon } from "@/shared/components/icons/PlusIcon";

type CharmManagementCardProps = {
  cardCharm: DisplayCharm | null;
  connectedDeviceId: number | null;
  displayCharms: DisplayCharm[];
  hasConnectedCharm: boolean;
  isExpanded: boolean;
  isListExpanded: boolean;
  pendingCharm: DisplayCharm | null;
  isPendingCharmLinked: boolean;
  deletePending: boolean;
  disconnectPending: boolean;
  connectPending: boolean;
  canConnect: boolean;
  onAddCharm: () => void;
  onConnectCharm: () => void;
  onOpenDeleteModal: () => void;
  onOpenDisconnectModal: () => void;
  onSelectCharm: (deviceId: number) => void;
  onShowCharmImage: (deviceId: number) => void;
  onToggleExpanded: () => void;
  onToggleListExpanded: () => void;
};

export function CharmManagementCard({
  cardCharm,
  connectedDeviceId,
  displayCharms,
  hasConnectedCharm,
  isExpanded,
  isListExpanded,
  pendingCharm,
  isPendingCharmLinked,
  deletePending,
  disconnectPending,
  connectPending,
  canConnect,
  onAddCharm,
  onConnectCharm,
  onOpenDeleteModal,
  onOpenDisconnectModal,
  onSelectCharm,
  onShowCharmImage,
  onToggleExpanded,
  onToggleListExpanded,
}: CharmManagementCardProps) {
  const hasHiddenCharmRows = displayCharms.length + 1 >= 4;
  const visibleCharms =
    hasHiddenCharmRows && !isListExpanded
      ? displayCharms.slice(0, 3)
      : displayCharms;
  const showAddCharmRow = !hasHiddenCharmRows || isListExpanded;

  return (
    <View className="mt-[26px] overflow-hidden rounded-[12px]">
      <View className="h-[99px] bg-white px-[15px] pt-4">
        <View className="flex-row items-start">
          <View
            className="h-[55px] w-[55px] items-center justify-center overflow-hidden rounded-full border bg-white"
            style={{ borderColor: "#898989" }}
          >
            {cardCharm?.image ? (
              <Image
                source={cardCharm.image}
                resizeMode="contain"
                style={{ height: 52, width: 52 }}
              />
            ) : (
              <Text className="text-[10px] font-medium text-[#898989]">
                참
              </Text>
            )}
          </View>
          <View className="ml-[5px] mr-2 flex-1 pt-0.5">
            <View className="flex-row items-center gap-[6px]">
              <View
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: hasConnectedCharm ? "#71EBA3" : "#898989",
                }}
              />
              <Text
                className="text-[14px] font-semibold text-[#121212]"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.78}
                allowFontScaling={false}
              >
                {cardCharm?.serialNumber ?? "연결된 참 없음"}
              </Text>
            </View>
            {cardCharm ? (
              <Text className="mt-[10px] text-[8px] font-normal text-[#3E3E3E]">
                배터리:{" "}
                {formatBatteryLabel(cardCharm) === "미지원"
                  ? "-"
                  : formatBatteryLabel(cardCharm)}
              </Text>
            ) : null}
          </View>
          <View className="pt-0.5">
            <CharmConnectionPill connected={hasConnectedCharm} />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? "참 목록 접기" : "참 목록 펼치기"}
          onPress={onToggleExpanded}
          className="absolute bottom-0 left-0 right-0 h-7 items-center justify-center"
        >
          <Chevron expanded={isExpanded} />
        </Pressable>
      </View>

      {isExpanded ? (
        <View className="bg-[#E4DDD5] px-5 pb-1 pt-[14px]">
          <View className="flex-row items-center justify-between">
            <Text className="text-[12px] font-semibold text-[#121212]">
              보유중인 참
            </Text>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={onOpenDeleteModal}
                disabled={!pendingCharm || deletePending}
                className="h-7 min-w-[50px] items-center justify-center rounded-[6px] bg-white px-2.5"
                style={{ opacity: !pendingCharm || deletePending ? 0.5 : 1 }}
              >
                <Text className="text-[8px] font-medium text-[#A51F21]">
                  참 삭제
                </Text>
              </Pressable>
              {isPendingCharmLinked ? (
                <Pressable
                  onPress={onOpenDisconnectModal}
                  disabled={disconnectPending}
                  className="h-7 min-w-[50px] items-center justify-center rounded-[6px] bg-[#814C27] px-2.5"
                  style={{ opacity: disconnectPending ? 0.5 : 1 }}
                >
                  <Text className="text-[8px] font-medium text-white">
                    연결 해제
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={onConnectCharm}
                  disabled={!pendingCharm || !canConnect || connectPending}
                  className="h-7 min-w-[50px] items-center justify-center rounded-[6px] bg-[#814C27] px-2.5"
                  style={{
                    opacity: !pendingCharm || !canConnect || connectPending ? 0.5 : 1,
                  }}
                >
                  <Text className="text-[8px] font-medium text-white">
                    연결
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          <View className="mt-[13px]">
            {visibleCharms.map((charm) => {
              const selected = charm.id === pendingCharm?.id;
              const linked = charm.id === connectedDeviceId;

              return (
                <Pressable
                  key={charm.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => onSelectCharm(charm.id)}
                  className="h-11 flex-row items-center border-b border-[#C3C3C3] px-1"
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${charm.serialNumber} 이미지 크게 보기`}
                    accessibilityHint="길게 누르면 이미지가 확대됩니다."
                    delayLongPress={350}
                    onPress={() => onSelectCharm(charm.id)}
                    onLongPress={() => onShowCharmImage(charm.id)}
                    className="h-[30px] w-[30px] items-center justify-center overflow-hidden rounded-full border bg-white"
                    style={{ borderColor: selected ? "#814C27" : "#898989" }}
                  >
                    {charm.image ? (
                      <Image
                        source={charm.image}
                        resizeMode="contain"
                        style={{ height: 28, width: 28 }}
                      />
                    ) : (
                      <Text className="text-[9px] font-medium text-[#898989]">
                        참
                      </Text>
                    )}
                  </Pressable>
                  <Text
                    className={`ml-3 flex-1 text-[10px] font-semibold ${
                      linked
                        ? "text-[#989898]"
                        : selected
                          ? "text-[#121212]"
                          : "text-[#3E3E3E]"
                    }`}
                    numberOfLines={1}
                  >
                    {charm.serialNumber}
                  </Text>
                  {linked ? (
                    <View className="h-[18px] min-w-[52px] items-center justify-center rounded-full bg-[#E1F7E7] px-2">
                      <Text className="text-[11px] font-medium text-[#269247]">
                        연결중
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}

            {showAddCharmRow ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="참 추가"
                onPress={onAddCharm}
                className="h-11 flex-row items-center px-1"
              >
                <View className="h-[30px] w-[30px] items-center justify-center rounded-full border border-[#898989] bg-[#F2F2F2]">
                  <PlusIcon size={18} color="#898989" />
                </View>
                <Text className="ml-3 text-[12px] font-semibold text-[#121212]">
                  참추가
                </Text>
              </Pressable>
            ) : null}
          </View>

          {hasHiddenCharmRows ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isListExpanded ? "보유한 참 간단히 보기" : "보유한 참 전체 보기"
              }
              onPress={onToggleListExpanded}
              className="h-10 items-center justify-center"
            >
              <Chevron expanded={isListExpanded} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
