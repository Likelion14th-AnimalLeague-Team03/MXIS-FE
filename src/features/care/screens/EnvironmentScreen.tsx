import { useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HumidityLineChart } from "@/features/care/components/HumidityLineChart";
import { Card } from "@/shared/components/Card";
import { DropletIcon } from "@/shared/components/icons/DropletIcon";
import { FootprintIcon } from "@/shared/components/icons/FootprintIcon";
import { ShieldIcon } from "@/shared/components/icons/ShieldIcon";
import { ThermometerIcon } from "@/shared/components/icons/ThermometerIcon";
import { ScreenHeader } from "@/shared/components/ScreenHeader";

const RANGES = ["최근 7일", "최근 30일", "최근 1년"] as const;

function StatTile({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="w-[47%] flex-row items-center gap-3 rounded-2xl border border-concierge-borderLight bg-white px-4 py-4">
      <View>
        <Text className="text-xs text-concierge-textMuted">{label}</Text>
        <Text className="mt-2 text-lg font-bold text-concierge-text">{value}</Text>
      </View>
      <View className="ml-auto size-10 items-center justify-center rounded-full bg-concierge-surfaceMuted">
        {icon}
      </View>
    </View>
  );
}

export function EnvironmentScreen() {
  const router = useRouter();
  const [range, setRange] = useState<(typeof RANGES)[number]>("최근 30일");

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView className="flex-1 px-6" contentContainerClassName="pb-8">
        <View className="mt-3">
          <ScreenHeader title="환경 데이터" onBack={() => router.back()} />
        </View>

        <View className="mt-4 flex-row rounded-xl bg-white p-1">
          {RANGES.map((label) => {
            const selected = range === label;
            return (
              <Pressable
                key={label}
                onPress={() => setRange(label)}
                className={`flex-1 items-center rounded-lg py-2.5 ${
                  selected ? "bg-concierge-primary" : ""
                }`}
              >
                <Text
                  className={`text-sm ${selected ? "text-white" : "text-concierge-textMuted"}`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Card className="mt-4 border-0 px-4 py-4">
          <Text className="text-lg font-semibold text-concierge-text">습도 변화</Text>
          <View className="mt-4 flex-row">
            <View className="mr-2 justify-between py-1">
              {["70%", "55%", "40%", "25%"].map((label) => (
                <Text key={label} className="text-xs text-concierge-textMuted">
                  {label}
                </Text>
              ))}
            </View>
            <HumidityLineChart width={260} />
          </View>
          <Text className="mt-4 text-sm text-concierge-textMuted">
            권장 범위 안에서 비교적 안정적으로 유지되었습니다.
          </Text>
        </Card>

        <View className="mt-4 flex-row flex-wrap justify-between gap-y-3">
          <StatTile icon={<ThermometerIcon size={18} />} label="평균 온도" value="22°C" />
          <StatTile icon={<DropletIcon size={18} />} label="평균 습도" value="42%" />
          <StatTile icon={<FootprintIcon size={18} />} label="외출 횟수" value="18회" />
          <StatTile icon={<ShieldIcon size={18} />} label="충격 횟수" value="2회" />
        </View>

        <Card className="mt-4 gap-2 border-0 bg-concierge-surfaceMuted px-4 py-4">
          <Text className="text-lg font-bold text-concierge-text">데이터 해석</Text>
          <Text className="text-[15px] font-medium text-[#222222]">
            이전 30일보다 습도 변화가 높았지만,{"\n"}온·습도 환경은 안정적이었습니다.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
