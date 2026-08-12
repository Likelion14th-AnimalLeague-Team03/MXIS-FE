import { useRouter } from "expo-router";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import storeHyundaiSeoul from "@/features/reservation/assets/store-hyundai-seoul.png";
import { formatDateTimeMeridiem } from "@/features/reservation/format";
import { useReservationStore } from "@/features/reservation/store";
import { Card } from "@/shared/components/Card";
import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";
import { CalendarXIcon } from "@/shared/components/icons/CalendarXIcon";
import { LocationPinIcon } from "@/shared/components/icons/LocationPinIcon";
import { PrimaryButton } from "@/shared/components/PrimaryButton";

function Chip({ label }: { label: string }) {
  return (
    <View className="rounded-full border border-[#E5D9D0] bg-[#F5EFEA] px-3 py-2">
      <Text className="text-xs tracking-tight text-[#5A4C42]">{label}</Text>
    </View>
  );
}

export function EntryScreen() {
  const router = useRouter();
  const confirmed = useReservationStore((state) => state.confirmed);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView className="flex-1 px-6 pt-4" contentContainerClassName="pb-6">
        <Text className="text-xl font-bold text-concierge-text">
          케어 컨시어지 예약
        </Text>
        <Text className="mt-6 text-base font-semibold text-[#1E1A17]">
          예약 현황
        </Text>

        {confirmed ? (
          <>
            <Card className="mt-3 border-0 bg-concierge-surfaceMuted px-4 py-4">
              <View className="flex-row items-center gap-2">
                <View className="size-1.5 rounded-full bg-concierge-primary" />
                <Text className="text-xs font-bold text-[#6D5243]">
                  예약 완료
                </Text>
              </View>

              <Text className="mt-3 text-sm text-concierge-textSecondary">
                예약 일시
              </Text>
              <Text className="mt-1 text-xl font-bold text-[#221F1D]">
                {formatDateTimeMeridiem(confirmed.date, confirmed.time)}
              </Text>

              <View className="mt-3 border-t border-concierge-borderLight" />

              <View className="mt-3 flex-row items-start justify-between">
                <View>
                  <Text className="text-sm text-concierge-textSecondary">
                    매장
                  </Text>
                  <Text className="mt-1 text-xl font-semibold text-[#221F1D]">
                    {confirmed.storeName}
                  </Text>
                  <Text className="mt-1 text-xs text-[#6E6965]">
                    {confirmed.storeAddress}
                  </Text>
                </View>
                <View className="mt-1 rounded-full border border-concierge-border bg-white px-3 py-1.5">
                  <Text className="text-xs text-[#3E352F]">
                    매장 자세히 보기
                  </Text>
                </View>
              </View>

              <View className="mt-4 border-t border-concierge-borderLight" />

              <View className="mt-3">
                <Text className="text-sm text-concierge-textSecondary">
                  서비스
                </Text>
                <Text className="mt-1 text-xl font-semibold text-[#221F1D]">
                  {confirmed.serviceName}
                </Text>
              </View>

              <View className="mt-4 flex-row gap-2">
                <Pressable
                  onPress={() => router.push("/reservation/detail")}
                  className="flex-1 items-center justify-center rounded-xl border border-concierge-border bg-white py-3"
                >
                  <Text className="text-base font-semibold text-[#5C4A40]">
                    예약 변경
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push("/reservation/detail")}
                  className="flex-1 items-center justify-center rounded-xl bg-concierge-primary py-3"
                >
                  <Text className="text-base font-semibold text-white">
                    예약 상세 보기
                  </Text>
                </Pressable>
              </View>
            </Card>

            <Card className="mt-4 flex-row items-center gap-4 border-0 bg-white px-5 py-5">
              <View className="size-14 items-center justify-center rounded-full bg-concierge-surfaceMuted">
                <CalendarXIcon size={28} color="#814C27" />
              </View>
              <View className="flex-1">
                <Text className="text-xl font-semibold text-[#221F1D]">
                  케어 컨시어지 예약
                </Text>
                <Text className="mt-1 text-sm text-[#4E4945]">
                  예약 현황 확인, 새로운 예약, 변경/취소까지 한 번에 관리하세요.
                </Text>
              </View>
            </Card>
            <PrimaryButton
              label="예약 바로가기"
              onPress={() => router.push("/reservation/input")}
              className="mt-3"
            />
          </>
        ) : (
          <>
            <Card className="mt-3 items-center border-0 bg-concierge-surfaceMuted px-6 py-8">
              <CalendarXIcon />
              <Text className="mt-4 text-xl font-semibold text-[#1E1A17]">
                예정된 예약이 없어요
              </Text>
              <Text className="mt-3 text-center text-sm leading-5 text-[#4A423C]">
                가까운 매장에서 케어 서비스를{"\n"}예약해보세요.{"\n"}
                예약 후 일정과 매장 정보를{"\n"}이 화면에서 확인할 수 있어요.
              </Text>
              <PrimaryButton
                label="예약 바로가기"
                onPress={() => router.push("/reservation/input")}
                className="mt-5 w-full"
              />
            </Card>

            <Text className="mt-6 text-base font-bold text-[#1E1A17]">
              추천 매장
            </Text>
            <Card className="mt-3 overflow-hidden border-concierge-borderLight bg-white">
              <Image
                source={storeHyundaiSeoul}
                className="h-[151px] w-full"
                resizeMode="cover"
              />
              <View className="px-4 py-4">
                <Text className="text-xl font-semibold text-[#1E1A17]">
                  더현대 서울점
                </Text>
                <View className="mt-2 flex-row items-center gap-1">
                  <LocationPinIcon />
                  <Text className="text-sm text-[#4A423C]">
                    서울 영등포구 여의대로 108
                  </Text>
                </View>
                <View className="mt-3 flex-row flex-wrap items-center gap-2">
                  <Chip label="오늘 예약 가능" />
                  <Chip label="도보 5분" />
                  <View className="ml-auto flex-row items-center gap-1 rounded-full border border-concierge-border bg-white px-3 py-2">
                    <Text className="text-xs text-[#3E352F]">
                      매장 자세히 보기
                    </Text>
                    <ChevronRightIcon size={6} />
                  </View>
                </View>
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
