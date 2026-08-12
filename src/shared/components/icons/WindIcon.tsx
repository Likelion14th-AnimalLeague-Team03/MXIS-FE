import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
};

export function WindIcon({ size = 20, color = "#121212" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 8h11.5a2.75 2.75 0 1 0-2.6-3.7M3 12h15.5a2.75 2.75 0 1 1-2.6 3.7M3 16h9.5a2.25 2.25 0 1 1-2.1 3"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
