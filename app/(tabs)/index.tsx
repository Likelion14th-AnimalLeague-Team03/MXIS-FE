import { Text, View } from "react-native";

export default function HomePage() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-2xl font-bold text-brand-900">MXIS</Text>
      <Text className="mt-2 text-base text-zinc-600">Home</Text>
    </View>
  );
}
