import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
};

export function DropletIcon({ size = 20, color = "#121212" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5s7 7.4 7 12.2a7 7 0 1 1-14 0c0-4.8 7-12.2 7-12.2Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
