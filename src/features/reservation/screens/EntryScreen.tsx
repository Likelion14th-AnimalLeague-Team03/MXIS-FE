import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCurrentProduct } from "@/features/product/hooks/useProduct";
import {
  ConciergePromoCard,
  FreeCareCard,
} from "@/features/reservation/components/ReservationEntryCards";
import { ReservationStatusCard } from "@/features/reservation/components/ReservationStatusCard";
import { useActiveReservations } from "@/features/reservation/hooks/useReservation";
import { useReservationStore } from "@/features/reservation/store";
import type {
  ReservationSummary,
  ReservationType,
} from "@/features/reservation/types";
import { Card } from "@/shared/components/Card";

export function EntryScreen() {
  const router = useRouter();
  const setPendingCareType = useReservationStore(
    (state) => state.setPendingCareType,
  );
  const resetDraft = useReservationStore((state) => state.resetDraft);
  const { productId, isPending: isProductPending } = useCurrentProduct();
  const {
    paidReservation,
    freeReservation,
    isPending: isReservationPending,
    error,
  } = useActiveReservations(productId);

  const isPending = isProductPending || isReservationPending;
  const hasAnyReservation = Boolean(paidReservation || freeReservation);

  const goToInput = (careType: ReservationType) => {
    setPendingCareType(careType);
    resetDraft();
    router.push("/reservation/input");
  };

  const renderStatusCard = (reservation: ReservationSummary) => (
    <ReservationStatusCard
      key={reservation.id}
      reservation={reservation}
      onPressEditSchedule={() =>
        router.push({
          pathname: "/reservation/datetime",
          params: { mode: "edit", id: String(reservation.id) },
        })
      }
      onPressDetail={() =>
        router.push({
          pathname: "/reservation/detail",
          params: { id: String(reservation.id) },
        })
      }
    />
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView className="flex-1 px-6 pt-6" contentContainerClassName="pb-6">
        <Text className="text-xl font-bold text-concierge-text">
          케어 컨시어지 예약
        </Text>
        <Text className="mt-10 text-base font-semibold text-[#1E1A17]">
          예약 현황
        </Text>

        {isPending ? (
          <Card className="mt-3 items-center rounded-[20px] border-0 bg-concierge-surfaceMuted px-6 py-10">
            <ActivityIndicator />
          </Card>
        ) : hasAnyReservation ? (
          <>
            {paidReservation ? renderStatusCard(paidReservation) : null}
            {freeReservation ? renderStatusCard(freeReservation) : null}
            {paidReservation ? null : (
              <ConciergePromoCard onPress={() => goToInput("PAID")} />
            )}
            {freeReservation ? null : (
              <FreeCareCard onPress={() => goToInput("FREE")} />
            )}
          </>
        ) : (
          <>
            <FreeCareCard onPress={() => goToInput("FREE")} />
            <ConciergePromoCard onPress={() => goToInput("PAID")} />
          </>
        )}

        {error ? (
          <Text className="mt-3 text-xs text-[#C04737]">{error.message}</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
