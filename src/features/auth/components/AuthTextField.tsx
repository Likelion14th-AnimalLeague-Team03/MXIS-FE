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
  error?: string;
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
  error,
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
        className={`h-[52px] rounded-[10px] border bg-white px-4 text-[14px] font-semibold text-concierge-text ${
          error ? "border-[#C04737]" : "border-concierge-border"
        }`}
        style={{ letterSpacing: -0.35 }}
      />
      {error ? (
        <Text className="mt-1.5 text-[12px] font-medium text-[#C04737]">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
