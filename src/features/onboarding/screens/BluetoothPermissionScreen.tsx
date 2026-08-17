import { useState } from "react";
import { PermissionsAndroid, Platform, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { SecondaryButton } from "@/shared/components/SecondaryButton";

function BluetoothMark() {
  return (
    <View className="h-16 w-16 items-center justify-center rounded-full border border-concierge-primary">
      <View className="h-12 w-9 items-center justify-center">
        <Svg width={32} height={42} viewBox="0 0 48 64" fill="none">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M26.172 15.792L31.436 21.056L26.172 26.32V15.792ZM26.172 48.208L31.436 42.944L26.172 37.68V48.208ZM20.532 32.036L9.1 20.532L12.408 17.224L21.508 26.32V4.512L38.056 21.056L27.148 32.04L38.128 43.02L21.584 59.568V37.68L12.408 46.776L9.1 43.468L20.532 32.036ZM23.612 64C37.604 64 47.228 57.38 47.228 31.96C47.228 6.62 37.604 0 23.616 0C9.628 0 0 6.62 0 32.04C0 57.376 9.624 64 23.612 64Z"
            fill="#814C27"
          />
        </Svg>
      </View>
    </View>
  );
}

async function requestAndroidBluetoothPermissions() {
  if (Platform.OS !== "android") {
    return true;
  }

  const permissions =
    Number(Platform.Version) >= 31
      ? [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]
      : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];

  const result = await PermissionsAndroid.requestMultiple(permissions);

  return permissions.every(
    (permission) => result[permission] === PermissionsAndroid.RESULTS.GRANTED,
  );
}

// 스크롤 없이 화면 안에 항상 다 들어오도록, ScrollView 대신 고정 flex 레이아웃을 씁니다.
// (ScrollView + min-h-full + mt-auto 조합은 리로드마다 버튼이 화면 밖으로 밀려나는 문제가 있었어요.)
export function BluetoothPermissionScreen() {
  const router = useRouter();
  const [permissionError, setPermissionError] = useState("");

  const handleContinue = async () => {
    const isGranted = await requestAndroidBluetoothPermissions();

    if (!isGranted) {
      setPermissionError(
        "MXIS Charm을 찾으려면 Bluetooth 권한 허용이 필요합니다.",
      );
      return;
    }

    router.push("/onboarding/charm-scan");
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-concierge-bg">
      <StatusBar style="dark" backgroundColor="#FAF6F1" />
      <View className="flex-1 px-6 pb-6 pt-6">
        <View className="flex-1">
          <Text className="text-xl font-bold text-concierge-text">
            Bluetooth 연결을 허용해 주세요.
          </Text>
          <Text className="mt-3 text-sm text-concierge-textSecondary">
            가까이 있는 MXIS Charm을 찾고 연결하기 위해 Bluetooth 권한이
            필요합니다.
          </Text>

          <View className="mt-5 h-60 items-center justify-center rounded-2xl bg-white">
            <BluetoothMark />
          </View>

          <View className="mt-4 rounded-xl bg-concierge-chip px-4 py-4">
            <Text className="text-sm font-bold text-concierge-text">
              권한 사용 범위
            </Text>
            <Text className="mt-2 text-sm text-concierge-textSecondary">
              기기 검색·연결에만 사용하며, 권한은 마이페이지에서 언제든 변경할
              수 있습니다.
            </Text>
          </View>
        </View>

        <View>
          {permissionError ? (
            <Text className="mb-3 text-center text-xs font-medium text-[#C04737]">
              {permissionError}
            </Text>
          ) : null}
          <PrimaryButton label="계속" onPress={handleContinue} />
          <SecondaryButton
            label="취소"
            onPress={() => router.back()}
            className="mt-2"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
