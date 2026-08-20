import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCurrentProduct, useProducts } from "@/features/product/hooks/useProduct";
import productThumb from "@/features/reservation/assets/product-thumb-small.png";
import { RESERVATION_STATUS_LABEL } from "@/features/reservation/constants";
import { formatDateShort, toReservationDateTime } from "@/features/reservation/format";
import {
  useActiveReservation,
  useCancelReservation,
  useReservation,
} from "@/features/reservation/hooks/useReservation";
import { AlertModal } from "@/shared/components/AlertModal";
import { Card } from "@/shared/components/Card";
import { ScreenHeader } from "@/shared/components/ScreenHeader";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <Text className="text-sm font-semibold text-concierge-textSecondary">
        {label}
      </Text>
      <View className="flex-1" />
      <Text className="text-sm font-semibold text-concierge-text">{value}</Text>
    </View>
  );
}

export function DetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  // 홈·완료 화면에서는 id를 넘겨주고, 예약 탭에서 바로 들어오면
  // 메인으로 선택한 가방의 진행 중인 예약을 찾아서 보여줘요.
  const { productId } = useCurrentProduct();
  const { activeReservation } = useActiveReservation(productId);
  const reservationId = id ? Number(id) : (activeReservation?.id ?? null);
  const { data: reservation, isPending, error } = useReservation(reservationId);
  const cancelReservation = useCancelReservation();
  // 예약 응답에는 제품 이미지가 없어서, 예약에 달린 productId로 제품 정보를 찾아 씁니다.
  const { data: products } = useProducts();
  const reservationProduct = reservation
    ? products?.find((item) => item.id === reservation.productId)
    : undefined;

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [doneVisible, setDoneVisible] = useState(false);

  const dateTime = reservation
    ? toReservationDateTime(reservation.reservedDate, reservation.reservedTime)
    : null;

  const handleConfirmCancel = () => {
    if (!reservation) return;

    cancelReservation.mutate(reservation.id, {
      onSuccess: () => {
        setConfirmVisible(false);
        setDoneVisible(true);
      },
      onError: () => setConfirmVisible(false),
    });
  };

  const handleDone = () => {
    setDoneVisible(false);
    router.replace("/(tabs)/reservation");
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      {reservation && dateTime ? (
        <>
          <View className="px-6 pt-6 mb-2">
            <ScreenHeader
              title="예약 상세"
              onBack={() => router.back()}
              right={
                <Text className="text-sm text-concierge-textSecondary">
                  {RESERVATION_STATUS_LABEL[reservation.status]}
                </Text>
              }
            />
          </View>

          <ScrollView
            className="flex-1 px-6"
            contentContainerClassName="gap-3 pb-6"
          >
            <Card className="mt-4 gap-3 bg-white px-4 py-3.5">
              <View className="flex-row items-center gap-3">
                <Image
                  source={
                    reservationProduct?.productImageUrl
                      ? { uri: reservationProduct.productImageUrl }
                      : productThumb
                  }
                  className="size-[58px] rounded-2xl"
                  resizeMode="cover"
                />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-concierge-text">
                    {reservation.productName ??
                      reservationProduct?.productName ??
                      "-"}
                  </Text>
                  {reservationProduct ? (
                    <Text className="mt-0.5 text-xs text-concierge-textMuted">
                      {[
                        reservationProduct.materialDisplayName,
                        reservationProduct.color,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                  ) : null}
                  <Text className="mt-0.5 text-xs text-concierge-textMuted">
                    {reservation.serviceType ?? "제품 컨디션 점검"}
                  </Text>
                </View>
              </View>

              <View className="border-t border-concierge-borderLight" />

              <DetailRow label="매장" value={reservation.storeName ?? "-"} />
              <DetailRow
                label="일정"
                value={`${formatDateShort(dateTime.date)} · ${dateTime.time}`}
              />
              <DetailRow
                label="예약 상태"
                value={RESERVATION_STATUS_LABEL[reservation.status]}
              />

              <View className="border-t border-concierge-borderLight" />

              <Text className="text-sm font-semibold text-concierge-text">
                요청사항
              </Text>
              <Text className="text-xs text-concierge-textMuted">
                {reservation.customerNote || "전달된 요청사항이 없어요."}
              </Text>
            </Card>

            <Card className="gap-1.5 bg-white px-4 py-3">
              <Text className="text-sm font-semibold text-concierge-textSecondary">
                매장 연락처
              </Text>
              <Text className="text-sm font-semibold text-concierge-text">
                {reservation.storePhone ?? "-"}
              </Text>
              {reservation.storeAddress ? (
                <Text className="text-xs text-concierge-textMuted">
                  {reservation.storeAddress}
                </Text>
              ) : null}
            </Card>

            <View className="gap-1 rounded-xl bg-concierge-surfaceMuted px-4 py-3">
              <Text className="text-xs font-semibold text-concierge-text">
                변경·취소 안내
              </Text>
              <Text className="text-xs text-concierge-textSecondary">
                방문 일정 변경은 가능한 시간 범위에서 다시 선택할 수 있습니다.
              </Text>
            </View>

            {cancelReservation.error ? (
              <Text className="text-xs text-[#C04737]">
                {cancelReservation.error.message}
              </Text>
            ) : null}

            {reservation.status === "PENDING_APPROVAL" ||
            reservation.status === "CONFIRMED" ? (
              <View className="mt-10 gap-2">
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/reservation/datetime",
                      params: { mode: "edit", id: String(reservation.id) },
                    })
                  }
                  className="items-center justify-center rounded-xl border border-concierge-border bg-white py-3.5"
                >
                  <Text className="text-base font-semibold text-concierge-text">
                    일정 변경
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setConfirmVisible(true)}
                  disabled={cancelReservation.isPending}
                  className="items-center justify-center rounded-xl border border-concierge-border bg-white py-3.5"
                >
                  <Text className="text-base font-semibold text-concierge-text">
                    예약 취소
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </ScrollView>
        </>
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          {isPending && reservationId !== null ? (
            <ActivityIndicator />
          ) : (
            <Text className="text-sm text-concierge-textMuted">
              {error?.message ?? "확인된 예약 정보가 없어요."}
            </Text>
          )}
        </View>
      )}

      <AlertModal
        visible={confirmVisible}
        title="예약을 취소하시겠어요?"
        description="예약을 취소하면 현재 예약 정보가 삭제되며, 다시 예약하려면 새로운 일정을 선택해야 합니다."
        actions={[
          { label: "돌아가기", onPress: () => setConfirmVisible(false) },
          {
            label: "예약 취소",
            onPress: handleConfirmCancel,
            variant: "accent",
          },
        ]}
        onRequestClose={() => setConfirmVisible(false)}
      />

      <AlertModal
        visible={doneVisible}
        title="예약이 취소되었어요."
        description={
          "예약 취소가 완료되었습니다. \n 새로운 일정으로 언제든 다시 예약할 수 있어요."
        }
        layout="column"
        actions={[{ label: "확인", onPress: handleDone, variant: "accent" }]}
        onRequestClose={handleDone}
      />
    </SafeAreaView>
  );
}
