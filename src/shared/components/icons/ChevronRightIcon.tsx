import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
};

export function ChevronRightIcon({ size = 9, color = "#111111" }: Props) {
  const height = (size * 15.3957) / 8.93241;

  return (
    <Svg width={size} height={height} viewBox="0 0 8.93241 15.3957" fill="none">
      <Path
        d="M0.716256 0.697838L7.53626 7.69784L0.716256 14.6978"
        stroke={color}
        strokeWidth={2}
      />
    </Svg>
  );
}
