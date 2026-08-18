import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useStores } from "@/features/reservation/hooks/useReservation";
import { useReservationStore } from "@/features/reservation/store";
import { MapPinIcon } from "@/shared/components/icons/MapPinIcon";
import { ScreenHeader } from "@/shared/components/ScreenHeader";

export function StoreScreen() {
  const router = useRouter();
  const draft = useReservationStore((state) => state.draft);
  const setDraftStore = useReservationStore((state) => state.setDraftStore);
  const [query, setQuery] = useState("");
  const { data, isPending, error } = useStores();

  const stores = useMemo(() => {
    const all = data ?? [];
    const q = query.trim();
    const filtered = q
      ? all.filter(
          (store) =>
            store.storeName.includes(q) || (store.address ?? "").includes(q),
        )
      : all;

    // 서버가 distanceKm을 주면(좌표를 함께 보낸 경우) 가까운 순, 아니면 이름순으로 정렬해요.
    return [...filtered].sort((a, b) => {
      if (a.distanceKm != null && b.distanceKm != null) {
        return a.distanceKm - b.distanceKm;
      }

      return a.storeName.localeCompare(b.storeName, "ko");
    });
  }, [data, query]);

  const handleSelect = (id: number, name: string, address: string | null) => {
    setDraftStore({ id, name, address });
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
        {isPending ? (
          <View className="items-center py-10">
            <ActivityIndicator />
          </View>
        ) : null}

        {error ? (
          <Text className="px-1 py-4 text-sm text-[#C04737]">{error.message}</Text>
        ) : null}

        {!isPending && !error && stores.length === 0 ? (
          <Text className="px-1 py-4 text-sm text-concierge-textMuted">
            표시할 매장이 없어요.
          </Text>
        ) : null}

        {stores.map((store) => {
          const selected = draft.storeId === store.id;
          return (
            <Pressable
              key={store.id}
              onPress={() => handleSelect(store.id, store.storeName, store.address ?? null)}
              className={` flex-row items-center justify-between rounded-xl border bg-white px-4 py-4 ${
                selected ? "border-black" : "border-concierge-borderLight"
              }`}
            >
              <View className="flex-1 pr-3">
                <Text className="text-base font-semibold text-concierge-text">
                  {store.storeName}
                </Text>
                {store.address ? (
                  <Text className="mt-1 text-xs text-concierge-textMuted">
                    {store.address}
                  </Text>
                ) : null}
                {store.openingHours ? (
                  <Text className="mt-1 text-xs text-concierge-textMuted">
                    {store.openingHours}
                  </Text>
                ) : null}
              </View>
              {store.distanceKm != null ? (
                <Text className="text-sm text-concierge-text">
                  {store.distanceKm.toFixed(1)}km
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
