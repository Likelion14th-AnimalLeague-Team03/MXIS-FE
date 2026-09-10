import { View, type ViewProps } from "react-native";

/** Figma 카드 공통 그림자 — 0px 4px 4px rgba(0,0,0,0.08) */
export const CARD_SHADOW = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 2,
  elevation: 3,
} as const;

type Props = ViewProps & {
  /** 그림자를 그리는 바깥 래퍼용 클래스 (주로 여백) */
  className?: string;
  /** 내용을 잘라내는 안쪽 카드용 클래스 (테두리·배경·padding·높이 등) */
  contentClassName?: string;
  /** 안쪽 카드에 직접 넘길 스타일 */
  contentStyle?: ViewProps["style"];
  /** 카드 모서리 반경. 두 레이어에 같은 값을 적용해야 그림자 모양이 맞아요. */
  radius?: number;
};

/**
 * 그림자와 `overflow: hidden`을 함께 쓰는 카드용 래퍼.
 *
 * iOS는 `overflow: hidden`이 레이어의 masksToBounds를 켜서 그림자까지 잘라내기 때문에,
 * 그림자는 바깥 View가 그리고 내용 클리핑은 안쪽 View가 담당하도록 두 겹으로 나눠요.
 */
export function ShadowCard({
  className,
  contentClassName,
  contentStyle,
  radius = 12,
  children,
  style,
  ...rest
}: Props) {
  return (
    <View
      className={className}
      style={[
        CARD_SHADOW,
        { backgroundColor: "#FFFFFF", borderRadius: radius },
        style,
      ]}
      {...rest}
    >
      <View
        className={`overflow-hidden ${contentClassName ?? ""}`}
        style={[{ borderRadius: radius }, contentStyle]}
      >
        {children}
      </View>
    </View>
  );
}
