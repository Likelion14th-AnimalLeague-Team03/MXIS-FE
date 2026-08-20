import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
};

export function FootprintIcon({ size = 20, color = "#121212" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 3.5c1.4 0 2.4 1.3 2.4 3.6 0 1.7-.5 2.6-.5 4.2 0 1.6 1 2.7 1 4.6 0 2.2-1.3 3.6-3 3.6-1.6 0-2.7-1.1-2.7-2.9 0-2.6 1.4-3.7 1.4-6.3 0-2-1-2.4-1-4.4 0-1.5.9-2.4 2.4-2.4Z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16.6 8.5c1.4 0 2.4 1.3 2.4 3.6 0 1.7-.5 2.1-.5 3.7 0 1.6 1 2.2 1 4.1 0 1.7-1.3 2.6-3 2.6-1.6 0-2.7-.6-2.7-2.4 0-2.6 1.4-2.7 1.4-5.3 0-2-1-2.9-1-4.9 0-1 .9-1.4 2.4-1.4Z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
