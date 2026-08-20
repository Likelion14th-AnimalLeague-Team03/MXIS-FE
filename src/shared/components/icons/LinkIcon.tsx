import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
};

export function LinkIcon({ size = 16, color = "#121212" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 14a5 5 0 0 0 7.1.4l2.1-2.1a5 5 0 0 0-7.1-7.1L10.6 6.7"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 10a5 5 0 0 0-7.1-.4l-2.1 2.1a5 5 0 0 0 7.1 7.1l1.4-1.4"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
