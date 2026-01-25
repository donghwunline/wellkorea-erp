/**
 * Send RFQ Modal.
 *
 * Modal for selecting vendors and sending RFQ for a purchase request.
 * Supports both SERVICE (outsourcing) and MATERIAL purchase request types.
 * Displays vendor offerings with pricing and lead time information.
 *
 * Two-phase workflow:
 * 1. Vendor Selection: Select which vendors to send RFQ to
 * 2. Email Editing: Configure email recipients (TO/CC) per vendor
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  LoadingState,
  Modal,
  ModalActions,
  Button,
  Icon,
  FormField,
  EmailTagInput,
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
  readonly vendorEmail: string | null;
  readonly displayName: string;
  readonly unitPrice: number | null;
  readonly currency: string;
  readonly leadTimeDays: number | null;
  readonly minOrderQuantity: number | null;
  readonly isPreferred: boolean;
  readonly notes: string | null;
}

/**
 * Internal email info state per vendor.
 */
interface VendorEmailState {
  to: string;
  ccEmails: string[];
}

/** Modal step type */
type ModalStep = 'vendor-selection' | 'email-editing';

/**
 * Normalize a VendorOffering (SERVICE).
 */
function normalizeServiceOffering(offering: VendorOffering): NormalizedOffering {
  return {
    id: offering.id,
    vendorId: offering.vendorId,
    vendorName: offering.vendorName,
    vendorEmail: offering.vendorEmail,
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
    vendorEmail: offering.vendorEmail,
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
  t,
}: {
  readonly offering: NormalizedOffering;
  readonly isSelected: boolean;
  readonly onToggle: (vendorId: number, checked: boolean) => void;
  readonly t: (key: string, options?: Record<string, unknown>) => string;
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
              {t('sendRfqModal.preferredVendor')}
            </Badge>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-steel-400">
          {offering.unitPrice !== null && offering.unitPrice > 0 && (
            <span>
              {t('sendRfqModal.unitPrice')}:{' '}
              <span className="text-copper-400">
                {formatPrice(offering.unitPrice, offering.currency)}
              </span>
            </span>
          )}
          {offering.leadTimeDays !== null && offering.leadTimeDays > 0 && (
            <span>
              {t('sendRfqModal.leadTime')}: <span className="text-white">{t('sendRfqModal.leadTimeDays', { days: offering.leadTimeDays })}</span>
            </span>
          )}
          {offering.minOrderQuantity !== null && offering.minOrderQuantity > 1 && (
            <span>{t('sendRfqModal.minQuantity')}: {offering.minOrderQuantity}</span>
          )}
        </div>
        {offering.notes && <p className="mt-1 text-xs text-steel-500">{offering.notes}</p>}
      </div>
    </label>
  );
}

/**
 * Email editing form for a single vendor.
 */
function VendorEmailForm({
  vendorName,
  emailState,
  onChange,
}: {
  readonly vendorName: string;
  readonly emailState: VendorEmailState;
  readonly onChange: (newState: VendorEmailState) => void;
}) {
  const [showCc, setShowCc] = useState(emailState.ccEmails.length > 0);

  return (
    <div className="rounded-lg border border-steel-700 bg-steel-800/50 p-4">
      <div className="mb-3 font-medium text-white">{vendorName}</div>
      <div className="space-y-3">
        <FormField
          label="To"
          type="email"
          value={emailState.to}
          onChange={(val) => onChange({ ...emailState, to: val })}
          placeholder="vendor@example.com"
          required
        />
        
        {!showCc ? (
           <button
             type="button"
             onClick={() => setShowCc(true)}
             className="flex items-center gap-1 text-xs text-copper-400 hover:text-copper-300"
           >
             <Icon name="plus" className="h-3 w-3" />
             Add CC
           </button>
        ) : (
          <EmailTagInput
            label="CC"
            emails={emailState.ccEmails}
            onChange={(cc) => onChange({ ...emailState, ccEmails: cc })}
            placeholder="cc@example.com"
          />
        )}
      </div>
    </div>
  );
}

export function SendRfqModal(props: SendRfqModalProps) {
  const { t } = useTranslation('widgets');
  const { purchaseRequestId, isOpen, onClose, onSuccess, type } = props;

  // State
  const [step, setStep] = useState<ModalStep>('vendor-selection');
  
  // Selected vendor IDs - keyed by purchaseRequestId to auto-reset
  const [selectionState, setSelectionState] = useState<{
    requestId: number;
    vendorIds: number[];
  }>({ requestId: purchaseRequestId, vendorIds: [] });

  // Email state: vendorId -> { to, ccEmails }
  const [emailStates, setEmailStates] = useState<Record<number, VendorEmailState>>({});
  
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens or request changes
  useEffect(() => {
    if (isOpen) {
      setStep('vendor-selection');
      setError(null);
      // Note: we don't reset selection here to preserve it if user closes/reopens
      // But we do ensuring requestId matches in selectionState
      setSelectionState((prev) => {
         if (prev.requestId !== purchaseRequestId) {
             return { requestId: purchaseRequestId, vendorIds: [] };
         }
         return prev;
      });
      setEmailStates({});
    }
  }, [isOpen, purchaseRequestId]);

  // Derive selected vendor IDs
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
      setError(err.message || t('sendRfqModal.error'));
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

  // Handle "Next" - Prepare email states
  const handleNext = useCallback(() => {
     if (selectedVendorIds.length === 0) {
       setError(t('sendRfqModal.noVendorsSelected'));
       return;
     }

     // Initialize email states for selected vendors
     const newEmailStates: Record<number, VendorEmailState> = {};
     
     selectedVendorIds.forEach(vendorId => {
         // Find vendor info (use first offering found for this vendor)
         const offering = offerings?.find(o => o.vendorId === vendorId);
         const vendorEmail = offering?.vendorEmail || '';
         
         // Preserve existing state if user went back and forth
         if (emailStates[vendorId]) {
             newEmailStates[vendorId] = emailStates[vendorId];
         } else {
             newEmailStates[vendorId] = {
                 to: vendorEmail,
                 ccEmails: [],
             };
         }
     });

     setEmailStates(newEmailStates);
     setStep('email-editing');
     setError(null);
  }, [selectedVendorIds, offerings, emailStates, t]);

  // Handle "Back"
  const handleBack = useCallback(() => {
    setStep('vendor-selection');
    setError(null);
  }, []);

  // Submit RFQ
  const handleSubmit = useCallback(() => {
    // Validate emails
    const invalidEmails = Object.entries(emailStates).some(([, state]) => !state.to.trim());
    if (invalidEmails) {
        setError(t('sendRfqModal.allEmailsRequired'));
        return;
    }

    sendRfqMutation.mutate({
      purchaseRequestId,
      vendorIds: selectedVendorIds,
      vendorEmails: emailStates,
    });
  }, [purchaseRequestId, selectedVendorIds, emailStates, sendRfqMutation, t]);

  // Get unique vendor count
  const uniqueVendorIds = offerings ? [...new Set(offerings.map((o) => o.vendorId))] : [];

  // Empty state message based on type
  const emptyStateMessage =
    type === 'SERVICE' ? (
      <>
        {t('sendRfqModal.emptyStateService')}
        <p className="mt-1 text-sm">{t('sendRfqModal.emptyStateServiceHint')}</p>
      </>
    ) : (
      <>
        {t('sendRfqModal.emptyStateMaterial')}
        <p className="mt-1 text-sm">{t('sendRfqModal.emptyStateMaterialHint')}</p>
      </>
    );

  // Render Vendor Selection Step
  const renderSelectionStep = () => (
    <>
      {/* Error Alert */}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Fetch Error */}
      {fetchError && !isLoading && (
        <Alert variant="error">
          {t('sendRfqModal.loadError', { message: fetchError.message })}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="py-8">
          <LoadingState message={t('sendRfqModal.loadingVendors')} />
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
              {t('sendRfqModal.vendorCountInfo', {
                total: uniqueVendorIds.length,
                selected: selectedVendorIds.length,
              })}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-copper-400 hover:underline"
              >
                {t('sendRfqModal.selectAll')}
              </button>
              <span className="text-steel-600">|</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-xs text-steel-400 hover:underline"
              >
                {t('sendRfqModal.deselectAll')}
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
                t={t}
              />
            ))}
          </div>
        </div>
      )}

      <ModalActions>
        <Button variant="ghost" onClick={onClose}>
          {t('sendRfqModal.cancel')}
        </Button>
        <Button
          variant="primary"
          onClick={handleNext}
          disabled={selectedVendorIds.length === 0}
        >
          {t('sendRfqModal.next')}
        </Button>
      </ModalActions>
    </>
  );

  // Render Email Editing Step
  const renderEmailStep = () => (
      <>
        <div className="mb-4 text-sm text-steel-400">
             {t('sendRfqModal.emailVerifyDescription')}
        </div>

        {error && (
            <Alert variant="error" className="mb-4" onClose={() => setError(null)}>
            {error}
            </Alert>
        )}

        <div className="max-h-96 space-y-4 overflow-y-auto pr-1">
            {selectedVendorIds.map(vendorId => {
                const offering = offerings?.find(o => o.vendorId === vendorId);
                const vendorName = offering?.vendorName || `Vendor ${vendorId}`;
                const emailState = emailStates[vendorId] || { to: '', ccEmails: [] };

                return (
                    <VendorEmailForm 
                        key={vendorId}
                        vendorName={vendorName}
                        emailState={emailState}
                        onChange={(newState) => setEmailStates(prev => ({ ...prev, [vendorId]: newState }))}
                    />
                );
            })}
        </div>

        <ModalActions>
            <Button variant="secondary" onClick={handleBack} disabled={sendRfqMutation.isPending}>
                {t('sendRfqModal.back')}
            </Button>
            <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={sendRfqMutation.isPending}
            >
                {sendRfqMutation.isPending && (
                    <Icon name="arrow-path" className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('sendRfqModal.sendWithCount', { count: selectedVendorIds.length })}
            </Button>
        </ModalActions>
      </>
  );

  return (
    <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={step === 'vendor-selection' ? t('sendRfqModal.titleVendorSelect') : t('sendRfqModal.titleEmailEdit')}
        size="md"
    >
      {step === 'vendor-selection' ? renderSelectionStep() : renderEmailStep()}
    </Modal>
  );
}