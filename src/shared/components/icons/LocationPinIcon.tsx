import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
};

export function LocationPinIcon({ size = 11, color = "#4E4742" }: Props) {
  const height = (size * 15.2184) / 10.5429;

  return (
    <Svg width={size} height={height} viewBox="0 0 10.5429 15.2184" fill="none">
      <Path
        d="M0.9 5.27143C0.9 -0.557143 9.64286 -0.557143 9.64286 5.27143C9.64286 10.1286 5.27143 14.0143 5.27143 14.0143C5.27143 14.0143 0.9 10.1286 0.9 5.27143Z"
        stroke={color}
        strokeWidth={1.8}
      />
      <Path
        d="M5.27143 6.73021C6.07619 6.73021 6.72857 6.07783 6.72857 5.27307C6.72857 4.46831 6.07619 3.81593 5.27143 3.81593C4.46667 3.81593 3.81429 4.46831 3.81429 5.27307C3.81429 6.07783 4.46667 6.73021 5.27143 6.73021Z"
        fill={color}
        stroke={color}
        strokeWidth={1.8}
      />
    </Svg>
  );
}
