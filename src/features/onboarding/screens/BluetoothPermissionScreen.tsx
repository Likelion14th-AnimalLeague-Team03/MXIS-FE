import { useState } from "react";
import {
  PermissionsAndroid,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { SecondaryButton } from "@/shared/components/SecondaryButton";

function BluetoothMark() {
  return (
    <View className="h-[96px] w-[96px] items-center justify-center rounded-full border border-concierge-primary">
      <Text
        className="text-[48px] font-bold text-concierge-primary"
        style={{ letterSpacing: -1.2 }}
      >
        B
      </Text>
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
      <ScrollView
        className="flex-1"
        contentContainerClassName="min-h-full px-6 pb-7 pt-[72px]"
        showsVerticalScrollIndicator={false}
      >
        <Text
          className="text-[24px] font-bold text-[#171310]"
          style={{ letterSpacing: -0.6, lineHeight: 32 }}
        >
          Bluetooth 연결을 허용해 주세요.
        </Text>
        <Text
          className="mt-7 text-[16px] font-semibold text-[#6E6964]"
          style={{ letterSpacing: -0.4, lineHeight: 26 }}
        >
          가까이 있는 MXIS Charm을 찾고 연결하기 위해 Bluetooth 권한이
          필요합니다.
        </Text>

        <View className="mt-5 h-[249px] items-center justify-center rounded-[18px] bg-white">
          <BluetoothMark />
        </View>

        <View className="mt-5 rounded-[18px] bg-[#FBF8F4] px-5 py-5">
          <Text
            className="text-[15px] font-bold text-[#201C19]"
            style={{ letterSpacing: -0.38 }}
          >
            권한 사용 범위
          </Text>
          <Text
            className="mt-3 text-[15px] font-medium text-[#6E6964]"
            style={{ letterSpacing: -0.38, lineHeight: 24 }}
          >
            기기 검색·연결에만 사용하며, 권한은 마이페이지에서 언제든 변경할
            수 있습니다.
          </Text>
        </View>

        <View className="mt-auto pt-[184px]">
          {permissionError ? (
            <Text className="mb-3 text-center text-[12px] font-medium text-[#C04737]">
              {permissionError}
            </Text>
          ) : null}
          <PrimaryButton
            label="계속"
            onPress={handleContinue}
            className="h-[52px] rounded-[10px]"
          />
          <SecondaryButton
            label="취소"
            onPress={() => router.back()}
            className="mt-[10px] h-[52px] rounded-[10px]"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
