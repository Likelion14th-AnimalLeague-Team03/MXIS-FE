import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CharmManagementCard } from "@/features/device/components/CharmManagementCard";
import {
  CharmImageModal,
  ConfirmModal,
} from "@/features/device/components/DeviceModals";
import { DeviceStatusSection } from "@/features/device/components/DeviceStatusSection";
import { ProductManagementSection } from "@/features/device/components/ProductManagementSection";
import {
  ProductHero,
  ProductSelector,
} from "@/features/device/components/ProductSelector";
import { useDeviceManagement } from "@/features/device/hooks/useDeviceManagement";

export function DeviceScreen() {
  const {
    addCharm,
    cardCharm,
    charmExpanded,
    charmListExpanded,
    closeDeleteModal,
    closeDisconnectModal,
    closeImageModal,
    connectSelectedCharm,
    connectedDeviceId,
    deleteModalVisible,
    deleteSelectedCharm,
    disconnectModalVisible,
    disconnectSelectedCharm,
    displayCharms,
    displayConnectedCharm,
    hasConnectedCharm,
    imageModalCharm,
    isConnectPending,
    isDeletePending,
    isDisconnectPending,
    isLoading,
    isMainProduct,
    isPendingCharmLinked,
    isSetPrimaryPending,
    isSyncPending,
    lastSyncedLabel,
    moveProduct,
    openDeleteModal,
    openDisconnectModal,
    pendingCharm,
    primarySummary,
    selectCharm,
    selectedProduct,
    selectedProductSummary,
    selectProduct,
    setPrimarySelectedProduct,
    showCharmImage,
    syncCharm,
    syncMessage,
    toggleCharmExpanded,
    toggleCharmListExpanded,
    visibleError,
    visibleProducts,
  } = useDeviceManagement();

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-concierge-bg">
      <ScrollView
        className="flex-1"
        contentContainerClassName="mx-auto w-full max-w-[390px] pb-8"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-6">
          <Text className="text-xl font-bold text-concierge-text">
            연동 및 기기관리
          </Text>
        </View>

        <ProductSelector
          products={visibleProducts}
          selectedProduct={selectedProduct}
          onMoveProduct={moveProduct}
          onSelectProduct={selectProduct}
        />

        <ProductHero product={selectedProduct} />

        <View className="px-6 pt-6">
          {isLoading ? (
            <Text className="py-4 text-center text-[14px] text-[#6B6B6B]">
              기기 정보를 불러오고 있습니다.
            </Text>
          ) : null}

          <ProductManagementSection
            product={selectedProduct}
            productSummary={selectedProductSummary}
            primarySummary={primarySummary}
            isMainProduct={isMainProduct}
            isSetPrimaryPending={isSetPrimaryPending}
            onSetPrimaryProduct={setPrimarySelectedProduct}
          />

          <CharmManagementCard
            cardCharm={cardCharm}
            connectedDeviceId={connectedDeviceId}
            displayCharms={displayCharms}
            hasConnectedCharm={hasConnectedCharm}
            isExpanded={charmExpanded}
            isListExpanded={charmListExpanded}
            pendingCharm={pendingCharm}
            isPendingCharmLinked={isPendingCharmLinked}
            deletePending={isDeletePending}
            disconnectPending={isDisconnectPending}
            connectPending={isConnectPending}
            canConnect={Boolean(selectedProduct)}
            onAddCharm={addCharm}
            onConnectCharm={connectSelectedCharm}
            onOpenDeleteModal={openDeleteModal}
            onOpenDisconnectModal={openDisconnectModal}
            onSelectCharm={selectCharm}
            onShowCharmImage={showCharmImage}
            onToggleExpanded={toggleCharmExpanded}
            onToggleListExpanded={toggleCharmListExpanded}
          />

          <DeviceStatusSection
            product={selectedProduct}
            productSummary={selectedProductSummary}
            connectedCharm={displayConnectedCharm}
            hasConnectedCharm={hasConnectedCharm}
            lastSyncedLabel={lastSyncedLabel}
            syncMessage={syncMessage}
            syncPending={isSyncPending}
            onSyncCharm={syncCharm}
          />

          {visibleError ? (
            <Text className="mt-4 text-center text-[12px] font-medium text-[#C04737]">
              {visibleError}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <CharmImageModal charm={imageModalCharm} onClose={closeImageModal} />

      <ConfirmModal
        visible={deleteModalVisible}
        title={`${pendingCharm?.serialNumber ?? "SN-0001"}을 가방에서 삭제할까요?`}
        body={
          "참을 삭제하면 현재 가방과의 연결이 해제되며\n보유중인 참 목록에서도 삭제돼요.\n필요하면 나중에 다시 등록할 수 있어요."
        }
        confirmLabel="삭제"
        onConfirm={deleteSelectedCharm}
        onCancel={closeDeleteModal}
        isPending={isDeletePending}
      />

      <ConfirmModal
        visible={disconnectModalVisible}
        title={`${pendingCharm?.serialNumber ?? "SN-0001"} 연결을 해제할까요?`}
        body="연결을 해제하면 재연결 전까지 센서 기록이 제품에 반영되지 않습니다."
        confirmLabel="연결 해제"
        onConfirm={disconnectSelectedCharm}
        onCancel={closeDisconnectModal}
        isPending={isDisconnectPending}
      />
    </SafeAreaView>
  );
}
