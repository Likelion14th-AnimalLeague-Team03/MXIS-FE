import Svg, { Path, Rect } from "react-native-svg";

import { colors } from "@/shared/styles/colors";

type Props = {
  size?: number;
  color?: string;
};

export function CheckmarkCircleIcon({ size = 67, color = colors.accent }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 67 67" fill="none">
      <Rect width={67} height={67} rx={33.5} fill={color} />
      <Path
        d="M27.1539 41.3252L47.4323 21.6949C47.9109 21.2316 48.4692 21 49.1073 21C49.7453 21 50.3036 21.2316 50.7822 21.6949C51.2607 22.1581 51.5 22.7086 51.5 23.3464C51.5 23.9841 51.2607 24.5338 50.7822 24.9955L28.8288 46.3051C28.3503 46.7684 27.792 47 27.1539 47C26.5158 47 25.9575 46.7684 25.479 46.3051L15.1902 36.3452C14.7117 35.882 14.482 35.3322 14.5011 34.696C14.5202 34.0598 14.7699 33.5093 15.25 33.0445C15.7302 32.5797 16.2988 32.3481 16.9561 32.3497C17.6133 32.3512 18.1811 32.5828 18.6597 33.0445L27.1539 41.3252Z"
        fill="white"
      />
    </Svg>
  );
}
