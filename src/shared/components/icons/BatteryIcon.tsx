import Svg, { Path, Rect } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
};

export function BatteryIcon({ size = 16, color = "#121212" }: Props) {
  const height = (size * 11) / 18;

  return (
    <Svg width={size} height={height} viewBox="0 0 18 11" fill="none">
      <Rect x={0.75} y={0.75} width={14.5} height={9.5} rx={2} stroke={color} strokeWidth={1.5} />
      <Path d="M17 4.2v2.6" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Rect x={2.5} y={2.5} width={9} height={6} rx={1} fill={color} />
    </Svg>
  );
}
