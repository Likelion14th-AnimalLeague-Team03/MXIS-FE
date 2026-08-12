import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
};

export function PlusIcon({ size = 20, color = "#121212" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4v16M4 12h16" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}
