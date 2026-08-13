import type { KeyboardTypeOptions, TextInputProps } from "react-native";
import { Text, TextInput, View } from "react-native";

type Props = {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  textContentType?: TextInputProps["textContentType"];
  labelHint?: string;
};

export function AuthTextField({
  label,
  value,
  placeholder,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize = "none",
  textContentType,
  labelHint,
}: Props) {
  return (
    <View>
      <Text className="mb-2 text-[14px] font-semibold text-concierge-text">
        {label}
        {labelHint ? (
          <Text className="font-medium text-concierge-textSecondary">
            {" "}
            {labelHint}
          </Text>
        ) : null}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#BABAB2"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        textContentType={textContentType}
        className="h-[52px] rounded-[10px] border border-concierge-border bg-white px-4 text-[14px] font-semibold text-concierge-text"
        style={{ letterSpacing: -0.35 }}
      />
    </View>
  );
}
