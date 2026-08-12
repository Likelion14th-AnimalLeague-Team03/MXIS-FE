import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
};

export function ShieldIcon({ size = 20, color = "#121212" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5 4.5 5.5v5.6c0 5.1 3.2 8.6 7.5 10.4 4.3-1.8 7.5-5.3 7.5-10.4V5.5L12 2.5Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ShieldCheckIcon({ size = 20, color = "#121212" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5 4.5 5.5v5.6c0 5.1 3.2 8.6 7.5 10.4 4.3-1.8 7.5-5.3 7.5-10.4V5.5L12 2.5Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M9 12.2 11.2 14.4 15.4 10"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
