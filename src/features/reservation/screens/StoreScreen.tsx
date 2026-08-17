import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RESERVATION_STORES } from "@/features/reservation/constants";
import { useReservationStore } from "@/features/reservation/store";
import { AlertModal } from "@/shared/components/AlertModal";
import { MapPinIcon } from "@/shared/components/icons/MapPinIcon";
import { ScreenHeader } from "@/shared/components/ScreenHeader";

export function StoreScreen() {
  const router = useRouter();
  const draft = useReservationStore((state) => state.draft);
  const setDraftStore = useReservationStore((state) => state.setDraftStore);
  const [query, setQuery] = useState("");
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);

  const stores = useMemo(() => {
    const q = query.trim();
    const filtered = q
      ? RESERVATION_STORES.filter(
          (store) => store.name.includes(q) || store.address.includes(q),
        )
      : RESERVATION_STORES;

    const sorted = [...filtered];
    if (locationGranted) {
      sorted.sort((a, b) => a.distanceKm - b.distanceKm);
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    }
    return sorted;
  }, [query, locationGranted]);

  const handleSelect = (name: string, address: string) => {
    setDraftStore(name, address);
    router.back();
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <View className="px-6 pt-6">
        <ScreenHeader title="매장 선택" onBack={() => router.back()} />

        <View className="mt-6 flex-row items-center gap-2 rounded-xl bg-white px-4 py-4">
          <MapPinIcon size={20} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="매장명 또는 지역 검색"
            placeholderTextColor="#999999"
            className="flex-1 text-sm text-concierge-text"
          />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 mt-3"
        contentContainerClassName="gap-2"
      >
        {stores.map((store) => {
          const selected = draft.storeName === store.name;
          return (
            <Pressable
              key={store.id}
              onPress={() => handleSelect(store.name, store.address)}
              className={` flex-row items-center justify-between rounded-xl border bg-white px-4 py-4 ${
                selected ? "border-black" : "border-concierge-borderLight"
              }`}
            >
              <View>
                <Text className="text-base font-semibold text-concierge-text">
                  {store.name}
                </Text>
                <Text className="mt-1 text-xs text-concierge-textMuted">
                  {store.address}
                </Text>
              </View>
              {locationGranted ? (
                <Text className="text-sm text-concierge-text">
                  {store.distanceKm}km
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
