import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
};

export function PencilIcon({ size = 14, color = "#814C27" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="m16.5 3.5 4 4L8 20 3.5 20.5 4 16l12.5-12.5Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
