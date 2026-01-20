/**
 * Send RFQ Modal.
 *
 * Modal for selecting vendors and sending RFQ for a purchase request.
 * Supports both SERVICE (outsourcing) and MATERIAL purchase request types.
 * Displays vendor offerings with pricing and lead time information.
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  LoadingState,
  Modal,
  ModalActions,
  Button,
  Icon,
} from '@/shared/ui';
import { catalogQueries, vendorOfferingRules, type VendorOffering } from '@/entities/catalog';
import {
  materialQueries,
  vendorMaterialOfferingRules,
  type VendorMaterialOffering,
} from '@/entities/material';
import { useSendRfq } from '@/features/rfq/send';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Base props for SendRfqModal.
 */
interface BaseProps {
  /** ID of the purchase request */
  readonly purchaseRequestId: number;
  /** Whether the modal is open */
  readonly isOpen: boolean;
  /** Callback when modal should close */
  readonly onClose: () => void;
  /** Callback after successful RFQ send */
  readonly onSuccess?: () => void;
}

/**
 * Props for SERVICE type (outsourcing).
 */
interface ServiceTypeProps extends BaseProps {
  /** Type discriminator */
  readonly type: 'SERVICE';
  /** Service category ID for fetching vendor offerings */
  readonly serviceCategoryId: number;
}

/**
 * Props for MATERIAL type.
 */
interface MaterialTypeProps extends BaseProps {
  /** Type discriminator */
  readonly type: 'MATERIAL';
  /** Material ID for fetching vendor offerings */
  readonly materialId: number;
}

export type SendRfqModalProps = ServiceTypeProps | MaterialTypeProps;

// =============================================================================
// UNIFIED OFFERING TYPE
// =============================================================================

/**
 * Normalized offering for display.
 * Abstracts differences between VendorOffering and VendorMaterialOffering.
 */
interface NormalizedOffering {
  readonly id: number;
  readonly vendorId: number;
  readonly vendorName: string;
  readonly displayName: string;
  readonly unitPrice: number | null;
  readonly currency: string;
  readonly leadTimeDays: number | null;
  readonly minOrderQuantity: number | null;
  readonly isPreferred: boolean;
  readonly notes: string | null;
}

/**
 * Normalize a VendorOffering (SERVICE).
 */
function normalizeServiceOffering(offering: VendorOffering): NormalizedOffering {
  return {
    id: offering.id,
    vendorId: offering.vendorId,
    vendorName: offering.vendorName,
    displayName: vendorOfferingRules.getDisplayName(offering),
    unitPrice: offering.unitPrice,
    currency: offering.currency,
    leadTimeDays: offering.leadTimeDays,
    minOrderQuantity: offering.minOrderQuantity,
    isPreferred: offering.isPreferred,
    notes: offering.notes,
  };
}

/**
 * Normalize a VendorMaterialOffering (MATERIAL).
 */
function normalizeMaterialOffering(offering: VendorMaterialOffering): NormalizedOffering {
  return {
    id: offering.id,
    vendorId: offering.vendorId,
    vendorName: offering.vendorName,
    displayName: vendorMaterialOfferingRules.getDisplayName(offering),
    unitPrice: offering.unitPrice,
    currency: offering.currency,
    leadTimeDays: offering.leadTimeDays,
    minOrderQuantity: offering.minOrderQuantity,
    isPreferred: offering.isPreferred,
    notes: offering.notes,
  };
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Vendor offering card with checkbox.
 */
function VendorOfferingCard({
  offering,
  isSelected,
  onToggle,
}: {
  readonly offering: NormalizedOffering;
  readonly isSelected: boolean;
  readonly onToggle: (vendorId: number, checked: boolean) => void;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onToggle(offering.vendorId, e.target.checked);
  };

  const formatPrice = (price: number | null, currency: string): string | null => {
    if (price === null) return null;
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: currency || 'KRW',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
        isSelected
          ? 'border-copper-500 bg-copper-500/10'
          : 'border-steel-700/50 bg-steel-800/30 hover:bg-steel-800/50'
      }`}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={handleChange}
        className="mt-1 h-4 w-4 rounded border-steel-600 bg-steel-800 text-copper-500 focus:ring-copper-500 focus:ring-offset-steel-900"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{offering.vendorName}</span>
          {offering.isPreferred && (
            <Badge variant="success" size="sm">
              선호업체
            </Badge>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-steel-400">
          {offering.unitPrice !== null && offering.unitPrice > 0 && (
            <span>
              단가:{' '}
              <span className="text-copper-400">
                {formatPrice(offering.unitPrice, offering.currency)}
              </span>
            </span>
          )}
          {offering.leadTimeDays !== null && offering.leadTimeDays > 0 && (
            <span>
              납기: <span className="text-white">{offering.leadTimeDays}일</span>
            </span>
          )}
          {offering.minOrderQuantity !== null && offering.minOrderQuantity > 1 && (
            <span>최소수량: {offering.minOrderQuantity}</span>
          )}
        </div>
        {offering.notes && <p className="mt-1 text-xs text-steel-500">{offering.notes}</p>}
      </div>
    </label>
  );
}

export function SendRfqModal(props: SendRfqModalProps) {
  const { purchaseRequestId, isOpen, onClose, onSuccess, type } = props;

  // Selected vendor IDs - keyed by purchaseRequestId to auto-reset
  const [selectionState, setSelectionState] = useState<{
    requestId: number;
    vendorIds: number[];
  }>({ requestId: purchaseRequestId, vendorIds: [] });
  const [error, setError] = useState<string | null>(null);

  // Derive selected vendor IDs, resetting when purchaseRequestId changes
  const selectedVendorIds = useMemo(
    () => (selectionState.requestId === purchaseRequestId ? selectionState.vendorIds : []),
    [selectionState.requestId, selectionState.vendorIds, purchaseRequestId]
  );

  // Update selection for current request
  const updateSelectedVendorIds = useCallback(
    (updater: (prev: number[]) => number[]) => {
      setSelectionState((prev) => ({
        requestId: purchaseRequestId,
        vendorIds: updater(prev.requestId === purchaseRequestId ? prev.vendorIds : []),
      }));
    },
    [purchaseRequestId]
  );

  // ==========================================================================
  // FETCH OFFERINGS BASED ON TYPE
  // ==========================================================================

  // SERVICE type: Fetch service category offerings
  const serviceQuery = useQuery({
    ...catalogQueries.currentOfferings(
      type === 'SERVICE' ? props.serviceCategoryId : 0
    ),
    enabled: isOpen && type === 'SERVICE' && props.serviceCategoryId > 0,
  });

  // MATERIAL type: Fetch material offerings
  const materialQuery = useQuery({
    ...materialQueries.currentOfferings(type === 'MATERIAL' ? props.materialId : 0),
    enabled: isOpen && type === 'MATERIAL' && props.materialId > 0,
  });

  // Determine which query to use based on type
  const isLoading = type === 'SERVICE' ? serviceQuery.isLoading : materialQuery.isLoading;
  const fetchError = type === 'SERVICE' ? serviceQuery.error : materialQuery.error;

  // Normalize offerings to unified type
  const offerings: NormalizedOffering[] | undefined = (() => {
    if (type === 'SERVICE' && serviceQuery.data) {
      return serviceQuery.data.map(normalizeServiceOffering);
    }
    if (type === 'MATERIAL' && materialQuery.data) {
      return materialQuery.data.map(normalizeMaterialOffering);
    }
    return undefined;
  })();

  // ==========================================================================
  // ACTIONS
  // ==========================================================================

  // Send RFQ mutation
  const sendRfqMutation = useSendRfq({
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      setError(err.message || 'RFQ 발송에 실패했습니다');
    },
  });

  // Toggle vendor selection
  const handleToggleVendor = useCallback(
    (vendorId: number, checked: boolean) => {
      updateSelectedVendorIds((prev) =>
        checked ? [...prev, vendorId] : prev.filter((id) => id !== vendorId)
      );
      setError(null);
    },
    [updateSelectedVendorIds]
  );

  // Select all vendors
  const handleSelectAll = useCallback(() => {
    if (offerings) {
      const allVendorIds = [...new Set(offerings.map((o) => o.vendorId))];
      updateSelectedVendorIds(() => allVendorIds);
    }
  }, [offerings, updateSelectedVendorIds]);

  // Deselect all vendors
  const handleDeselectAll = useCallback(() => {
    updateSelectedVendorIds(() => []);
  }, [updateSelectedVendorIds]);

  // Submit RFQ
  const handleSubmit = useCallback(() => {
    if (selectedVendorIds.length === 0) {
      setError('최소 1개 업체를 선택해주세요');
      return;
    }

    sendRfqMutation.mutate({
      purchaseRequestId,
      vendorIds: selectedVendorIds,
    });
  }, [purchaseRequestId, selectedVendorIds, sendRfqMutation]);

  // Get unique vendor count
  const uniqueVendorIds = offerings ? [...new Set(offerings.map((o) => o.vendorId))] : [];

  // Empty state message based on type
  const emptyStateMessage =
    type === 'SERVICE' ? (
      <>
        이 서비스 카테고리에 등록된 업체가 없습니다.
        <p className="mt-1 text-sm">설정 &gt; 서비스 카탈로그에서 업체를 등록해주세요.</p>
      </>
    ) : (
      <>
        이 자재에 등록된 공급업체가 없습니다.
        <p className="mt-1 text-sm">설정 &gt; 자재 관리에서 공급업체를 등록해주세요.</p>
      </>
    );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="RFQ 발송" size="md">
      {/* Error Alert */}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Fetch Error */}
      {fetchError && !isLoading && (
        <Alert variant="error">
          업체 목록을 불러오는데 실패했습니다: {fetchError.message}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="py-8">
          <LoadingState message="업체 목록을 불러오는 중..." />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && offerings && offerings.length === 0 && (
        <Alert variant="warning">{emptyStateMessage}</Alert>
      )}

      {/* Vendor List */}
      {!isLoading && offerings && offerings.length > 0 && (
        <div className="space-y-4">
          {/* Selection Controls */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-steel-400">
              견적을 요청할 업체를 선택하세요 ({uniqueVendorIds.length}개 업체 중{' '}
              {selectedVendorIds.length}개 선택)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-copper-400 hover:underline"
              >
                전체 선택
              </button>
              <span className="text-steel-600">|</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-xs text-steel-400 hover:underline"
              >
                선택 해제
              </button>
            </div>
          </div>

          {/* Vendor Cards */}
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {offerings.map((offering) => (
              <VendorOfferingCard
                key={offering.id}
                offering={offering}
                isSelected={selectedVendorIds.includes(offering.vendorId)}
                onToggle={handleToggleVendor}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal Actions */}
      <ModalActions>
        <Button variant="ghost" onClick={onClose}>
          취소
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={selectedVendorIds.length === 0 || sendRfqMutation.isPending}
        >
          {sendRfqMutation.isPending && (
            <Icon name="arrow-path" className="mr-2 h-4 w-4 animate-spin" />
          )}
          RFQ 발송 ({selectedVendorIds.length})
        </Button>
      </ModalActions>
    </Modal>
  );
}
