import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
};

export function RefreshIcon({ size = 24, color = "#121212" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 11A8 8 0 1 0 18.5 15.5"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 6V11H15"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
