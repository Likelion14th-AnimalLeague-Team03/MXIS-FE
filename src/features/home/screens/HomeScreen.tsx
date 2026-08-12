import { useRouter } from "expo-router";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import homeProduct from "@/features/home/assets/home-back.png";
import { formatDateShort } from "@/features/reservation/format";
import { useReservationStore } from "@/features/reservation/store";
import { Card } from "@/shared/components/Card";
import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";
import { CheckmarkRingIcon } from "@/shared/components/icons/CheckmarkRingIcon";

function daysUntil(date: Date) {
  const today = new Date();
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round(
    (target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
}

export function HomeScreen() {
  const router = useRouter();
  const confirmed = useReservationStore((state) => state.confirmed);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        <View className="px-6 pt-4">
          <Text className="text-[15px] font-semibold text-[#747270]">
            안녕하세요, 김멋사님!
          </Text>
          <Text className="mt-1 text-2xl font-bold text-concierge-text">
            햇빛이 강한 날이에요
          </Text>
          <Text className="text-2xl font-bold text-concierge-text">
            직사광선을 피해 보관해주세요.
          </Text>
        </View>

        <Image
          source={homeProduct}
          className="mx-auto mt-4 h-[208px] w-[356px] rounded-2xl"
          resizeMode="cover"
        />

        <View className="px-6">
          <Card className="mt-4 flex-row items-center justify-between border-0 px-5 py-6">
            <View className="flex-1 pr-4">
              <Text className="text-sm text-concierge-text">제품상태</Text>
              <Text className="mt-1 text-xl font-bold text-concierge-text">
                Excellent
              </Text>
              <Text className="mt-1 text-sm text-concierge-text">
                모든 환경 지표가 이상적입니다.
              </Text>
            </View>
            <CheckmarkRingIcon size={56} />
          </Card>

          <View className="mt-4 flex-row gap-3">
            <Card className="flex-1 border-0 px-4 py-5">
              <Text className="text-sm text-concierge-text">함께한 날짜</Text>
              <Text className="mt-5 text-xl font-bold text-[#494949]">
                182일
              </Text>
            </Card>

            <Card className="flex-1 border-0 px-4 py-5">
              {confirmed ? (
                <>
                  <View className="flex-row items-center gap-2">
                    <View className="rounded-full border border-[#A49486] px-2 py-0.5">
                      <Text className="text-xs text-[#A49486]">
                        D-{Math.max(daysUntil(confirmed.date), 0)}
                      </Text>
                    </View>
                    <Text className="flex-1 text-sm text-concierge-text">
                      다가오는 예약
                    </Text>
                  </View>
                  <Text className="mt-3 text-sm font-semibold text-concierge-text">
                    {formatDateShort(confirmed.date)} · {confirmed.time}
                  </Text>
                  <Text className="mt-1 text-sm text-[#494949]">
                    케어 전문가 방문
                  </Text>
                  <Pressable
                    onPress={() => router.push("/reservation/detail")}
                    className="mt-4 flex-row items-center justify-between"
                  >
                    <Text className="text-sm text-concierge-text">
                      예약 상세
                    </Text>
                    <ChevronRightIcon size={7} />
                  </Pressable>
                </>
              ) : (
                <>
                  <Text className="text-sm text-concierge-text">
                    다가오는 예약
                  </Text>
                  <Text className="mt-5 text-sm text-concierge-textMuted">
                    예정된 예약이 없어요.
                  </Text>
                  <Pressable
                    onPress={() => router.push("/reservation/input")}
                    className="mt-4 flex-row items-center justify-between"
                  >
                    <Text className="text-sm text-concierge-text">
                      예약하기
                    </Text>
                    <ChevronRightIcon size={7} />
                  </Pressable>
                </>
              )}
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
