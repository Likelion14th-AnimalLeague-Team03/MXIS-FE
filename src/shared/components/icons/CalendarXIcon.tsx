import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
};

export function CalendarXIcon({ size = 60, color = "#6E5D50" }: Props) {
  const height = (size * 57) / 60;

  return (
    <Svg width={size} height={height} viewBox="0 0 60 57" fill="none">
      <Path
        d="M38 6H8C4.13401 6 1 9.13401 1 13V34C1 37.866 4.13401 41 8 41H38C41.866 41 45 37.866 45 34V13C45 9.13401 41.866 6 38 6Z"
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="M10 0V10M36 0V10M9 22H12M19 22H22M29 22H32M9 32H12M19 32H22M29 32H32"
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="M46 56C53.1797 56 59 50.1797 59 43C59 35.8203 53.1797 30 46 30C38.8203 30 33 35.8203 33 43C33 50.1797 38.8203 56 46 56Z"
        stroke={color}
        strokeWidth={2}
      />
      <Path d="M41 38L51 48M51 38L41 48" stroke={color} strokeWidth={2} />
    </Svg>
  );
}
