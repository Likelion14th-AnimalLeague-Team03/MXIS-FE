import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

type Props = {
  percent: number;
  color: string;
  size?: number;
  trackColor?: string;
};

export function ProgressRing({
  percent,
  color,
  size = 60,
  trackColor = "#E9F0F4",
}: Props) {
  const strokeWidth = size * 0.05;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference * (1 - Math.min(Math.max(percent, 0), 100) / 100);

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text
        style={{
          color,
          fontSize: size * (14 / 60),
          fontWeight: "700",
          lineHeight: size * (16 / 60),
        }}
      >
        {percent}%
      </Text>
    </View>
  );
}
