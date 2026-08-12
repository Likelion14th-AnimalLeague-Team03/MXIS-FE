import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import careHero from "@/features/care/assets/care-hero.png";
import { Card } from "@/shared/components/Card";
import { ChevronRightIcon } from "@/shared/components/icons/ChevronRightIcon";
import { DropletIcon } from "@/shared/components/icons/DropletIcon";
import { FootprintIcon } from "@/shared/components/icons/FootprintIcon";
import { ShieldIcon } from "@/shared/components/icons/ShieldIcon";
import { ThermometerIcon } from "@/shared/components/icons/ThermometerIcon";

function StatCard({
  icon,
  label,
  caption,
  value
}: {
  icon: ReactNode;
  label: string;
  caption?: string;
  value: string;
}) {
  return (
    <Card className="w-[47%] border-0 bg-white px-3 py-3">
      <View className="flex-row items-center gap-1.5">
        {icon}
        <Text className="text-base font-semibold text-concierge-text">{label}</Text>
      </View>
      {caption ? <Text className="mt-1 text-[8px] text-concierge-text">{caption}</Text> : null}
      <Text className="mt-2 text-2xl font-bold text-concierge-text">{value}</Text>
    </Card>
  );
}

export function CareHomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView className="flex-1 px-6" contentContainerClassName="pb-8">
        <Text className="pt-4 text-xl font-bold text-concierge-text">케어진단</Text>

        <Card className="mt-4 flex-row items-center gap-4 overflow-hidden border-concierge-borderLight bg-white p-0">
          <Image source={careHero} className="h-[171px] w-[45%]" resizeMode="cover" />
          <View className="flex-1 pr-3">
            <Text className="text-base font-bold text-concierge-text">MCM Aren Shopper</Text>
            <Text className="mt-1 text-[11px] text-concierge-textMuted">
              Visetos Canvas · Cognac
            </Text>
            <Text className="mt-2 text-xs font-medium text-concierge-text">함께한 외출 50회</Text>
          </View>
        </Card>

        <Card className="mt-4 border-0 bg-white px-3.5 py-3.5">
          <Text className="text-xs text-concierge-textMuted">현재 컨디션</Text>
          <Text className="mt-1 text-lg font-bold text-concierge-text">
            균형 있게 유지되고 있습니다.
          </Text>
          <Text className="mt-1 text-[11px] text-concierge-textMuted">
            최근 환경과 사용 기록이 안정적인 범위에 있습니다.
          </Text>
          <Pressable
            onPress={() => router.push("/care/report")}
            className="mt-2 flex-row items-center justify-end gap-1"
          >
            <Text className="text-[11px] font-medium text-concierge-text">상태 리포트 보기</Text>
            <ChevronRightIcon size={5} />
          </Pressable>
        </Card>

        <Pressable
          onPress={() => router.push("/care/environment")}
          className="mt-6 flex-row items-center justify-between"
        >
          <View>
            <Text className="text-2xl font-semibold text-concierge-text">환경 요약</Text>
            <Text className="mt-1 text-[13px] text-concierge-textMuted">
              최근 30일 동안의 평균이에요.
            </Text>
          </View>
          <ChevronRightIcon size={9} />
        </Pressable>

        <View className="mt-3 flex-row flex-wrap justify-between gap-y-3">
          <StatCard
            icon={<ThermometerIcon size={22} />}
            label="온도"
            caption="이상적입니다."
            value="22 °C"
          />
          <StatCard
            icon={<DropletIcon size={22} />}
            label="습도"
            caption="이상적입니다."
            value="42 %"
          />
          <StatCard icon={<ShieldIcon size={22} />} label="충격" value="낮음" />
          <StatCard icon={<FootprintIcon size={22} />} label="최근 이동" value="18회" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
