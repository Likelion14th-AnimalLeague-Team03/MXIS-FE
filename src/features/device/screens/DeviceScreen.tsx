import { useMemo, useState } from "react";
import {
  Image,
  type ImageSourcePropType,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import heroBackground from "@/features/device/assets/final/device-hero-bg-final.png";
import charmBear from "@/features/device/assets/charm2.png";
import charmRabbit from "@/features/device/assets/charm3.png";
import ellaBostonThumbnail from "@/features/device/assets/bag1.png";
import himmelShopperThumbnail from "@/features/device/assets/bag2.png";
import starkBackpackThumbnail from "@/features/device/assets/bag3.png";
import { BatteryIcon } from "@/shared/components/icons/BatteryIcon";
import { InfoIcon } from "@/shared/components/icons/InfoIcon";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { SecondaryButton } from "@/shared/components/SecondaryButton";
import { useDeviceStore } from "@/features/device/store";

type Product = {
  id: string;
  name: string;
  material: string;
  color: string;
  outings: number;
  thumb: ImageSourcePropType;
  hero: ImageSourcePropType;
};

type Charm = {
  id: string;
  label: string;
  image: ImageSourcePropType;
  battery: number;
};

const PRODUCTS: Product[] = [
  {
    id: "stark",
    name: "Stark 사이드 스터드 비세토스 백팩",
    material: "Visetos Canvas",
    color: "black",
    outings: 18,
    thumb: starkBackpackThumbnail,
    hero: starkBackpackThumbnail,
  },
  {
    id: "ella",
    name: "Ella 비세토스 보스턴 백",
    material: "Visetos Canvas",
    color: "cognac",
    outings: 50,
    thumb: ellaBostonThumbnail,
    hero: ellaBostonThumbnail,
  },
  {
    id: "himmel",
    name: "MCM Himmel Shopper",
    material: "Lauretos Canvas",
    color: "oatmeal",
    outings: 12,
    thumb: himmelShopperThumbnail,
    hero: himmelShopperThumbnail,
  },
];

const CHARMS_BY_ID: Record<string, Charm> = {
  "sn-0001": { id: "sn-0001", label: "SN-0001", image: charmBear, battery: 65 },
  "sn-0022": {
    id: "sn-0022",
    label: "SN-0022",
    image: charmRabbit,
    battery: 82,
  },
  "sn-0033": { id: "sn-0033", label: "SN-0033", image: charmBear, battery: 73 },
};

function Pill({ label }: { label: string }) {
  return (
    <View className="rounded-full border border-[#814C27] px-[9px] py-[3px]">
      <Text
        className="text-[11px] font-medium text-[#814C27]"
        style={{ letterSpacing: -0.11, lineHeight: 16 }}
      >
        {label}
      </Text>
    </View>
  );
}

function Chevron({ expanded }: { expanded?: boolean }) {
  return (
    <View className="h-6 w-6 items-center justify-center">
      <Svg
        width={8.25}
        height={15.0151}
        viewBox="0 0 8.25 15.0151"
        fill="none"
        style={{ transform: [{ rotate: expanded ? "-90deg" : "90deg" }] }}
      >
        <Path
          d="M0.75 15.015C0.651636 15.0162 0.55411 14.9968 0.463693 14.9581C0.373276 14.9193 0.291969 14.8621 0.225 14.79C-0.075 14.49 -0.075 14.025 0.225 13.725L6.45 7.5L0.225 1.29C-0.075 0.99 -0.075 0.525 0.225 0.225C0.525 -0.075 0.99 -0.075 1.29 0.225L8.025 6.99C8.325 7.29 8.325 7.755 8.025 8.055L1.275 14.79C1.125 14.94 0.93 15.015 0.75 15.015Z"
          fill="#111111"
        />
      </Svg>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text
        className="text-[14px] font-medium text-[#262626]"
        style={{ letterSpacing: -0.35, lineHeight: 20 }}
      >
        {label}
      </Text>
      <Text
        className="text-[14px] font-medium text-[#262626]"
        style={{ letterSpacing: -0.35, lineHeight: 20 }}
      >
        {value}
      </Text>
    </View>
  );
}

function formatLastSyncedAt(value: string | null) {
  if (!value) return "*월 *일";

  const syncedAt = new Date(value).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - syncedAt);
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));

  if (diffHours < 1) return "방금전";
  if (diffHours < 24) return `${diffHours}시간 전`;

  const date = new Date(value);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function ConfirmModal({
  visible,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 items-center justify-center bg-black/35 px-6">
        <View className="w-full max-w-[342px] rounded-[16px] bg-[#FAF6F1] px-5 pb-[18px] pt-[22px]">
          <Text
            className="text-[20px] font-semibold text-[#121212]"
            style={{ letterSpacing: -0.5, lineHeight: 28 }}
          >
            {title}
          </Text>
          <Text
            className="mt-[14px] text-[14px] font-medium text-[#63635E]"
            style={{ letterSpacing: -0.35, lineHeight: 20 }}
          >
            {body}
          </Text>
          <PrimaryButton
            label={confirmLabel}
            onPress={onConfirm}
            className="mt-[18px] h-[48px] rounded-[8px]"
          />
          <SecondaryButton
            label="취소"
            onPress={onCancel}
            className="mt-[10px] h-[48px] rounded-[8px]"
          />
          <Text
            className="mt-[12px] text-center text-[12px] font-medium text-[#898989]"
            style={{ letterSpacing: -0.12, lineHeight: 17 }}
          >
            기존 기록은 삭제되지 않습니다.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

export function DeviceScreen() {
  const router = useRouter();
  const [selectedProductId, setSelectedProductId] = useState("ella");
  const [mainProductId, setMainProductId] = useState("ella");
  const [charmExpanded, setCharmExpanded] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [disconnectModalVisible, setDisconnectModalVisible] = useState(false);
  const ownedCharmIds = useDeviceStore((state) => state.ownedCharmIds);
  const currentCharmId = useDeviceStore((state) => state.currentCharmId);
  const pendingCharmId = useDeviceStore((state) => state.pendingCharmId);
  const deleteOwnedCharm = useDeviceStore((state) => state.deleteOwnedCharm);
  const setCurrentCharmId = useDeviceStore((state) => state.setCurrentCharmId);
  const setPendingCharmId = useDeviceStore((state) => state.setPendingCharmId);
  const lastSyncedAt = useDeviceStore((state) => state.lastSyncedAt);

  const selectedIndex = PRODUCTS.findIndex(
    (product) => product.id === selectedProductId,
  );
  const selectedProduct = PRODUCTS[selectedIndex] ?? PRODUCTS[1];
  const isMainProduct = selectedProduct.id === mainProductId;
  const ownedCharms = ownedCharmIds
    .map((id) => CHARMS_BY_ID[id])
    .filter((charm): charm is Charm => Boolean(charm));
  const connectedCharm =
    ownedCharms.find((charm) => charm.id === currentCharmId) ?? null;
  const pendingCharm =
    ownedCharms.find((charm) => charm.id === pendingCharmId) ?? null;
  const hasConnectedCharm = Boolean(connectedCharm);
  const isPendingCharmConnected = Boolean(
    pendingCharm && pendingCharm.id === currentCharmId,
  );
  const lastSyncedLabel = formatLastSyncedAt(lastSyncedAt);

  const visibleProducts = useMemo(() => {
    const previous =
      PRODUCTS[(selectedIndex - 1 + PRODUCTS.length) % PRODUCTS.length];
    const next = PRODUCTS[(selectedIndex + 1) % PRODUCTS.length];

    return [previous, selectedProduct, next];
  }, [selectedIndex, selectedProduct]);

  const moveProduct = (direction: "prev" | "next") => {
    const offset = direction === "prev" ? -1 : 1;
    const nextIndex =
      (selectedIndex + offset + PRODUCTS.length) % PRODUCTS.length;
    setSelectedProductId(PRODUCTS[nextIndex].id);
    setCharmExpanded(false);
  };

  const confirmDeleteCharm = () => {
    if (!pendingCharm) return;

    deleteOwnedCharm(pendingCharm.id);
    setDeleteModalVisible(false);
  };

  const confirmDisconnectCharm = () => {
    setCurrentCharmId(null);
    setDisconnectModalVisible(false);
    setCharmExpanded(false);
  };

  const handleConnectCharm = () => {
    if (!pendingCharm) return;

    setCurrentCharmId(pendingCharm.id);
  };

  const handleAddCharm = () => {
    router.push({
      pathname: "/onboarding/charm-scan",
      params: { returnTo: "device" },
    });
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView
        className="flex-1"
        contentContainerClassName="mx-auto w-full max-w-[390px] pb-8"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-6">
          <Text className="text-xl font-bold text-concierge-text">
            연동 및 기기관리
          </Text>
        </View>

        <View className="mt-[18px] flex-row items-center justify-between px-5">
          <Pressable onPress={() => moveProduct("prev")} hitSlop={12}>
            <Text className="text-[34px] font-light text-[#111111]">‹</Text>
          </Pressable>

          <View className="flex-1 items-center">
            <View className="flex-row items-center justify-center gap-[20px]">
              {visibleProducts.map((product) => {
                const selected = product.id === selectedProduct.id;
                return (
                  <Pressable
                    key={product.id}
                    onPress={() => setSelectedProductId(product.id)}
                  >
                    <View
                      className="h-20 w-20 items-center justify-center"
                      style={{
                        borderRadius: 40,
                        borderWidth: 1,
                        borderColor: selected ? "#E4AB7C" : "transparent",
                      }}
                    >
                      <Image
                        source={product.thumb}
                        resizeMode="cover"
                        style={{ height: 55, width: 55 }}
                      />
                    </View>
                    <View
                      className="mt-[2px] h-[3px] w-[22px] self-center rounded-full"
                      style={{
                        backgroundColor: selected ? "#E4AB7C" : "transparent",
                      }}
                    />
                  </Pressable>
                );
              })}
            </View>
            <Text
              className="mt-1 text-[14px] font-medium text-[#6B6B6B]"
              style={{ letterSpacing: -0.35, lineHeight: 20 }}
            >
              좌우로 넘겨 가방을 선택하세요
            </Text>
          </View>

          <Pressable onPress={() => moveProduct("next")} hitSlop={12}>
            <Text className="text-[34px] font-light text-[#111111]">›</Text>
          </Pressable>
        </View>

        <View
          className="mt-[10px] overflow-hidden self-center"
          style={{ height: 220.43, width: 388 }}
        >
          <Image
            source={heroBackground}
            style={{ height: 220.43, width: 388 }}
            resizeMode="cover"
          />
          <View className="absolute inset-0 items-center mt-12">
            <Image
              source={selectedProduct.hero}
              resizeMode="contain"
              style={{ height: 178, width: 316 }}
            />
          </View>
        </View>

        <View className="px-6 pt-6">
          <View className="flex-row items-start justify-between">
            <View>
              <Text
                className="text-[14px] font-semibold text-[#171717]"
                style={{ letterSpacing: -0.35, lineHeight: 20 }}
              >
                {selectedProduct.name}
              </Text>
              <Text
                className="mt-[2px] text-[14px] font-medium text-[#6B6B6B]"
                style={{ letterSpacing: -0.35, lineHeight: 20 }}
              >
                {selectedProduct.material} · {selectedProduct.color}
              </Text>
              <Text
                className="mt-[2px] text-[14px] font-medium text-[#232323]"
                style={{ letterSpacing: -0.35, lineHeight: 20 }}
              >
                함께한 외출{" "}
                <Text className="text-[#814C27]">
                  {selectedProduct.outings}회
                </Text>
              </Text>
            </View>
            {isMainProduct ? <Pill label="현재 메인" /> : null}
          </View>

          <Pressable
            onPress={() => setMainProductId(selectedProduct.id)}
            disabled={isMainProduct}
            className={`mt-[18px] h-[48px] items-center justify-center rounded-[10px] ${
              isMainProduct ? "bg-[rgba(195,195,195,0.6)]" : "bg-[#814C27]"
            }`}
          >
            <Text
              className={`text-[14px] font-medium ${
                isMainProduct ? "text-[#898989]" : "text-white"
              }`}
              style={{ letterSpacing: -0.35, lineHeight: 20 }}
            >
              {isMainProduct ? "현재 선택된 가방입니다." : "메인 가방으로 확정"}
            </Text>
          </Pressable>

          <View className="mt-[26px] overflow-hidden rounded-[12px] bg-white">
            <View className="min-h-[84px] flex-row items-center px-4 py-3">
              <View
                className="h-[61px] w-[61px] items-center justify-center overflow-hidden rounded-full border bg-white"
                style={{ borderColor: "#E4E1DD" }}
              >
                <Image
                  source={connectedCharm?.image ?? charmBear}
                  resizeMode="contain"
                  style={{ height: 52, width: 52 }}
                />
              </View>
              <View className="ml-3 flex-1">
                <View className="flex-row items-center gap-[6px]">
                  <View
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: hasConnectedCharm
                        ? "#71EBA3"
                        : "#898989",
                    }}
                  />
                  <Text
                    className="text-[14px] font-semibold text-[#121212]"
                    style={{ letterSpacing: -0.35, lineHeight: 20 }}
                  >
                    {connectedCharm?.label ?? "SN-0001"}
                  </Text>
                </View>
                {hasConnectedCharm ? (
                  <Text className="mt-1 text-[12px] font-normal text-[#3E3E3E]">
                    배터리: {connectedCharm?.battery}%
                  </Text>
                ) : null}
              </View>
              <Pill label={hasConnectedCharm ? "연결됨" : "연결 해제됨"} />
            </View>

            <Pressable
              onPress={() => setCharmExpanded((prev) => !prev)}
              className="items-center pb-[6px]"
            >
              <Chevron expanded={charmExpanded} />
            </Pressable>

            {charmExpanded ? (
              <View className="bg-[#E4DDD5] px-[18px] pb-5 pt-2">
                <Text
                  className="text-[16px] font-semibold text-[#121212]"
                  style={{ letterSpacing: -0.4, lineHeight: 22 }}
                >
                  보유중인 참
                </Text>

                <ScrollView
                  horizontal
                  className="mt-3"
                  contentContainerStyle={{
                    gap: 19,
                    minWidth: "100%",
                    paddingRight: 4,
                  }}
                  showsHorizontalScrollIndicator={false}
                >
                  {ownedCharms.map((charm) => {
                    const selected = charm.id === pendingCharmId;
                    const connected = charm.id === currentCharmId;

                    return (
                      <Pressable
                        key={charm.id}
                        onPress={() => setPendingCharmId(charm.id)}
                        className="shrink-0 items-center"
                      >
                        <View className="h-[85px] w-[85px] items-center justify-center overflow-hidden rounded-full border border-[#898989] bg-white">
                          <Image
                            source={charm.image}
                            resizeMode="contain"
                            style={{ height: 82, width: 82 }}
                          />
                          {selected ? (
                            <View className="absolute inset-0 items-center justify-center bg-black/35">
                              <Text className="text-[12px] font-semibold text-white">
                                선택
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text
                          className="mt-1 text-[14px] font-semibold text-[#121212]"
                          style={{ letterSpacing: -0.35, lineHeight: 20 }}
                        >
                          {charm.label}
                        </Text>
                        {connected ? (
                          <View className="mt-1 rounded-[10px] bg-[#E1F7E7] px-2 py-[2px]">
                            <Text className="text-[11px] font-medium text-[#269247]">
                              연결중
                            </Text>
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}

                  <Pressable
                    onPress={handleAddCharm}
                    className="h-[85px] w-[85px] shrink-0 items-center justify-center rounded-full border border-[#898989] bg-[#C3C3C3]"
                  >
                    <Text className="text-[32px] font-light text-white">+</Text>
                  </Pressable>
                </ScrollView>

                <View className="mt-5 flex-row items-center justify-between">
                  <Text
                    className="text-[12px] font-medium text-[#898989]"
                    style={{ letterSpacing: -0.12, lineHeight: 17 }}
                  >
                    선택한 참을 가방에 연결해주세요
                  </Text>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => setDeleteModalVisible(true)}
                      disabled={!pendingCharm}
                      className="h-7 items-center justify-center rounded-[6px] bg-white px-3"
                    >
                      <Text className="text-[12px] font-medium text-[#A51F21]">
                        참 삭제
                      </Text>
                    </Pressable>
                    {isPendingCharmConnected ? (
                      <Pressable
                        onPress={() => setDisconnectModalVisible(true)}
                        className="h-7 items-center justify-center rounded-[6px] bg-[#814C27] px-3"
                      >
                        <Text className="text-[12px] font-medium text-white">
                          연결 해제
                        </Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={handleConnectCharm}
                        disabled={!pendingCharm}
                        className="h-7 items-center justify-center rounded-[6px] bg-[#814C27] px-3"
                      >
                        <Text className="text-[12px] font-medium text-white">
                          참 연결
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            ) : null}
          </View>

          <Text
            className="mt-[26px] text-[18px] font-bold text-[#171717]"
            style={{ lineHeight: 26 }}
          >
            세부 기기관리
          </Text>

          <View className="mt-2 rounded-[12px] border border-[#E4E1DD] bg-white px-4 py-3">
            <Text
              className="text-[14px] font-medium text-[#222222]"
              style={{ letterSpacing: -0.35, lineHeight: 20 }}
            >
              현재 보관 환경
            </Text>

            <View className="mt-3 flex-row items-center">
              <View className="flex-1 items-center">
                <Text className="text-[20px] font-semibold text-[#171717]">
                  {hasConnectedCharm ? "23°C" : "-°C"}
                </Text>
                <Text className="text-[11px] text-[#686868]">온도</Text>
              </View>
              <View className="h-10 w-px bg-[#E4E1DD]" />
              <View className="flex-1 items-center">
                <Text className="text-[20px] font-semibold text-[#171717]">
                  {hasConnectedCharm ? "48%" : "-%"}
                </Text>
                <Text className="text-[11px] text-[#686868]">습도</Text>
              </View>
            </View>

            <View className="mt-3 h-px bg-[#E4E1DD]" />
            <Text
              className="mt-[5px] text-[12px] font-medium text-[#686868]"
              style={{ letterSpacing: -0.12, lineHeight: 17 }}
            >
              {hasConnectedCharm
                ? "권장 범위로 유지 중이에요"
                : "데이터가 없어요"}
            </Text>
          </View>

          <View className="mt-[18px] overflow-hidden rounded-[12px] border border-[#E4E1DD] bg-white px-4">
            <View className="flex-row items-center justify-between py-[9px]">
              <View className="flex-row items-center gap-3">
                <BatteryIcon size={17} />
                <Text className="text-[14px] font-medium text-[#262626]">
                  배터리 상태
                </Text>
              </View>
              <Text className="text-[14px] font-medium text-[#262626]">
                {hasConnectedCharm ? `${connectedCharm?.battery}%` : "-%"}
              </Text>
            </View>
            <View className="h-px bg-[#E4E1DD]" />
            <View className="flex-row items-center justify-between py-[9px]">
              <View className="flex-row items-center gap-3">
                <InfoIcon size={15} />
                <Text className="text-[14px] font-medium text-[#262626]">
                  마지막 연동
                </Text>
              </View>
              <Text className="text-[14px] font-medium text-[#676767]">
                {lastSyncedLabel}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <ConfirmModal
        visible={deleteModalVisible}
        title={`${pendingCharm?.label ?? "SN-0001"}을 가방에서 삭제할까요?`}
        body={
          "참을 삭제하면 현재 가방과의 연결이 해지되며\n보유 중인 참 목록에서도 삭제돼요.\n필요하면 나중에 다시 등록할 수 있어요."
        }
        confirmLabel="삭제"
        onConfirm={confirmDeleteCharm}
        onCancel={() => setDeleteModalVisible(false)}
      />

      <ConfirmModal
        visible={disconnectModalVisible}
        title={`${connectedCharm?.label ?? "SN-0001"} 연결을 해제할까요?`}
        body="연결을 해제하면 재연결 전까지 센서 기록이 제품에 반영되지 않습니다."
        confirmLabel="연결 해제"
        onConfirm={confirmDisconnectCharm}
        onCancel={() => setDisconnectModalVisible(false)}
      />
    </SafeAreaView>
  );
}
