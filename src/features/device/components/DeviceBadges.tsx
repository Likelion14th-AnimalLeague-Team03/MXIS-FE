import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

export function Pill({ label }: { label: string }) {
  return (
    <View className="rounded-full border border-[#814C27] px-[9px] py-[3px]">
      <Text className="text-[11px] font-medium text-[#814C27]">{label}</Text>
    </View>
  );
}

export function CharmConnectionPill({ connected }: { connected: boolean }) {
  return (
    <View
      className={`h-[18px] min-w-[58px] items-center justify-center rounded-full px-2 ${
        connected ? "bg-[#E1F7E7]" : "bg-[#814C27]"
      }`}
    >
      <Text
        className={`text-[11px] font-medium ${
          connected ? "text-[#269247]" : "text-white"
        }`}
        style={{ lineHeight: 15 }}
      >
        {connected ? "연결됨" : "연결 해제됨"}
      </Text>
    </View>
  );
}

export function Chevron({ expanded }: { expanded?: boolean }) {
  return (
    <View className="h-6 w-6 items-center justify-center">
      <Svg
        width={15}
        height={9}
        viewBox="0 0 15 9"
        fill="none"
        style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
      >
        <Path
          d="M1.25 1.5L7.5 7.25L13.75 1.5"
          stroke="#111111"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
