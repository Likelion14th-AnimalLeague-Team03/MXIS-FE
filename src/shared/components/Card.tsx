import { View, type ViewProps } from "react-native";

type Props = ViewProps & {
  className?: string;
};

export function Card({ className, children, ...rest }: Props) {
  return (
    <View
      className={`rounded-xl border border-concierge-borderLight bg-white ${className ?? ""}`}
      {...rest}
    >
      {children}
    </View>
  );
}
