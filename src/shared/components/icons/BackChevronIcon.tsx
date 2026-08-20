import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
};

export function BackChevronIcon({ size = 10, color = "#111111" }: Props) {
  const height = (size * 18.8256) / 9.92572;

  return (
    <Svg width={size} height={height} viewBox="0 0 9.92572 18.8256" fill="none">
      <Path
        d="M8.82571 1.1L1.1 9.4128L8.82571 17.7256"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
