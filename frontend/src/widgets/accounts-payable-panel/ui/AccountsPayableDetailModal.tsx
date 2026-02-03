/**
 * Accounts Payable Detail Modal
 *
 * Modal for viewing accounts payable details with payment history.
 * Opens RecordAPPaymentModal for recording payments.
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, DatePicker, Icon, LoadingState, Modal, ModalActions } from '@/shared/ui';
import {
  type AccountsPayable,
  accountsPayableQueries,
  accountsPayableRules,
  AccountsPayableStatusBadge,
  VendorPaymentHistoryTable,
} from '@/entities/accounts-payable';
import { RecordAPPaymentModal } from '@/features/accounts-payable/record-payment';
import { useUpdateAPMetadata } from '@/features/accounts-payable/update-metadata';
import { formatDate, formatDateTime } from '@/shared/lib/formatting';
import { cn } from '@/shared/lib/cn';

export interface AccountsPayableDetailModalProps {
  /** Accounts Payable ID to display */
  readonly apId: number;
  /** Whether modal is open */
  readonly isOpen: boolean;
  /** Callback when modal should close */
  readonly onClose: () => void;
  /** Optional callback after successful action */
  readonly onSuccess?: () => void;
}

export function AccountsPayableDetailModal({
  apId,
  isOpen,
  onClose,
  onSuccess,
}: AccountsPayableDetailModalProps) {
  const { t } = useTranslation('widgets');
  const queryClient = useQueryClient();

  // Modal state for recording payments
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Edit mode state for due date
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [editDueDate, setEditDueDate] = useState<string | null>(null);

  // Success/error message state with auto-dismiss
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const showSuccess = useCallback((message: string) => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    setSuccessMessage(message);
    setErrorMessage(null);
    successTimeoutRef.current = setTimeout(() => {
      setSuccessMessage(null);
      successTimeoutRef.current = null;
    }, 3000);
  }, []);

  // Update metadata mutation
  const updateMetadataMutation = useUpdateAPMetadata({
    onSuccess: () => {
      showSuccess(t('accountsPayableDetailModal.editDueDate.success'));
      setIsEditingDueDate(false);
    },
    onError: () => {
      setErrorMessage(t('accountsPayableDetailModal.editDueDate.error'));
    },
  });

  // Fetch AP detail
  const {
    data: apDetail,
    isLoading,
    error: fetchError,
  } = useQuery({
    ...accountsPayableQueries.detail(apId),
    enabled: isOpen && apId > 0,
  });

  // Handle opening payment modal
  const handlePayClick = useCallback(() => {
    setShowPaymentModal(true);
  }, []);

  // Handle closing payment modal
  const handlePaymentModalClose = useCallback(() => {
    setShowPaymentModal(false);
  }, []);

  // Handle successful payment
  const handlePaymentSuccess = useCallback(() => {
    // Invalidate the detail query to refresh payment history
    queryClient.invalidateQueries({ queryKey: accountsPayableQueries.all() });
    onSuccess?.();
  }, [queryClient, onSuccess]);

  // Handle starting due date edit
  const handleStartEditDueDate = useCallback(() => {
    setEditDueDate(apDetail?.dueDate ?? null);
    setIsEditingDueDate(true);
  }, [apDetail]);

  // Handle canceling due date edit
  const handleCancelEditDueDate = useCallback(() => {
    setIsEditingDueDate(false);
    setEditDueDate(null);
  }, []);

  // Handle saving due date
  const handleSaveDueDate = useCallback(() => {
    if (!apDetail) return;
    updateMetadataMutation.mutate({
      id: apDetail.id,
      input: {
        dueDate: editDueDate,
        notes: apDetail.notes,
      },
    });
  }, [apDetail, editDueDate, updateMetadataMutation]);

  // Handle date picker change
  const handleDueDateChange = useCallback((value: string | { start: string | null; end: string | null }) => {
    if (typeof value === 'string') {
      setEditDueDate(value || null);
    }
  }, []);

  // AccountsPayableDetail extends AccountsPayable, so direct assignment is type-safe
  const apForPaymentModal: AccountsPayable | null = apDetail ?? null;

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('accountsPayableDetailModal.title')} size="lg">
        <LoadingState message={t('accountsPayableDetailModal.loading')} />
      </Modal>
    );
  }

  if (fetchError) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('accountsPayableDetailModal.title')} size="lg">
        <Alert variant="error">{t('accountsPayableDetailModal.loadError')}</Alert>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            {t('accountsPayableDetailModal.close')}
          </Button>
        </ModalActions>
      </Modal>
    );
  }

  if (!apDetail) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('accountsPayableDetailModal.title')} size="lg">
        <Alert variant="error">{t('accountsPayableDetailModal.notFound')}</Alert>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            {t('accountsPayableDetailModal.close')}
          </Button>
        </ModalActions>
      </Modal>
    );
  }

  const paymentProgress = accountsPayableRules.getPaymentProgress(apDetail);
  const canReceivePayment = accountsPayableRules.canReceivePayment(apDetail);

  return (
    <>
      <Modal
        isOpen={isOpen && !showPaymentModal}
        onClose={onClose}
        title={t('accountsPayableDetailModal.title')}
        size="lg"
      >
        {/* Success/Error Messages */}
        {successMessage && (
          <Alert variant="success" className="mb-4">{successMessage}</Alert>
        )}
        {errorMessage && (
          <Alert variant="error" className="mb-4">{errorMessage}</Alert>
        )}

        {/* AP Info */}
        <Card className={cn("mb-4 border-steel-700 bg-steel-800/50 p-4", isEditingDueDate && "relative z-10")}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <div className="text-xs text-steel-400">{t('accountsPayableDetailModal.fields.status')}</div>
              <div className="mt-1">
                <AccountsPayableStatusBadge status={apDetail.calculatedStatus} />
              </div>
            </div>
            <div>
              <div className="text-xs text-steel-400">{t('accountsPayableDetailModal.fields.vendor')}</div>
              <div className="mt-1 text-sm font-medium text-white">{apDetail.vendorName}</div>
            </div>
            <div>
              <div className="text-xs text-steel-400">{t('accountsPayableDetailModal.fields.reference')}</div>
              <div className="mt-1 text-sm text-copper-400">{apDetail.causeReferenceNumber}</div>
            </div>
            <div>
              <div className="text-xs text-steel-400">{t('accountsPayableDetailModal.fields.dueDate')}</div>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`text-sm ${apDetail.isOverdue ? 'text-red-400' : 'text-white'}`}
                >
                  {apDetail.dueDate ? formatDate(apDetail.dueDate) : t('accountsPayableDetailModal.noDueDate')}
                  {apDetail.isOverdue && apDetail.daysOverdue > 0 && (
                    <span className="ml-1 text-xs">
                      ({t('accountsPayableDetailModal.daysOverdue', { days: apDetail.daysOverdue })})
                    </span>
                  )}
                </span>
                <button
                  onClick={handleStartEditDueDate}
                  className="rounded p-1 text-steel-400 hover:bg-steel-700 hover:text-white"
                  title={t('accountsPayableDetailModal.editDueDate.button')}
                >
                  <Icon name="pencil" className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Due Date Edit Row - Full Width */}
          {isEditingDueDate && (
            <div className="mt-4 flex items-center gap-3 border-t border-steel-700 pt-4">
              <span className="text-sm text-steel-400">
                {t('accountsPayableDetailModal.editDueDate.label')}:
              </span>
              <DatePicker
                mode="single"
                value={editDueDate ?? ''}
                onChange={handleDueDateChange}
                placeholder={t('accountsPayableDetailModal.noDueDate')}
                clearable
                className="w-44"
              />
              <Button
                size="sm"
                variant="primary"
                onClick={handleSaveDueDate}
                disabled={updateMetadataMutation.isPending}
              >
                {updateMetadataMutation.isPending
                  ? t('accountsPayableDetailModal.editDueDate.saving')
                  : t('accountsPayableDetailModal.editDueDate.save')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelEditDueDate}
                disabled={updateMetadataMutation.isPending}
              >
                {t('accountsPayableDetailModal.editDueDate.cancel')}
              </Button>
            </div>
          )}

          {/* Payment Progress */}
          <div className="mt-4 border-t border-steel-700 pt-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-steel-400">{t('accountsPayableDetailModal.paymentProgress')}</span>
              <span className="text-steel-300">{paymentProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-steel-700">
              <div
                className={`h-full transition-all ${
                  paymentProgress === 100 ? 'bg-green-500' : 'bg-copper-500'
                }`}
                style={{ width: `${paymentProgress}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs">
              <span className="text-green-400">
                {t('accountsPayableDetailModal.paid', { amount: accountsPayableRules.formatTotalPaid(apDetail) })}
              </span>
              <span className="text-yellow-400">
                {t('accountsPayableDetailModal.remaining', { amount: accountsPayableRules.formatRemainingBalance(apDetail) })}
              </span>
            </div>
          </div>
        </Card>

        {/* Amounts */}
        <Card className="mb-4 border-steel-700 bg-steel-800/50 p-4">
          <h4 className="mb-3 text-sm font-semibold text-white">{t('accountsPayableDetailModal.sections.amounts')}</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-steel-400">{t('accountsPayableDetailModal.amounts.total')}</div>
              <div className="mt-1 font-mono text-sm font-bold text-copper-400">
                {accountsPayableRules.formatTotalAmount(apDetail)}
              </div>
            </div>
            <div>
              <div className="text-xs text-steel-400">{t('accountsPayableDetailModal.amounts.paid')}</div>
              <div className="mt-1 font-mono text-sm text-green-400">
                {accountsPayableRules.formatTotalPaid(apDetail)}
              </div>
            </div>
            <div>
              <div className="text-xs text-steel-400">{t('accountsPayableDetailModal.amounts.remaining')}</div>
              <div
                className={`mt-1 font-mono text-sm font-bold ${
                  apDetail.remainingBalance > 0 ? 'text-yellow-400' : 'text-green-400'
                }`}
              >
                {accountsPayableRules.formatRemainingBalance(apDetail)}
              </div>
            </div>
          </div>
        </Card>

        {/* Payment History */}
        <Card className="mb-4 border-steel-700 bg-steel-800/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">{t('accountsPayableDetailModal.sections.paymentHistory')}</h4>
            <span className="text-xs text-steel-400">
              {t('accountsPayableDetailModal.paymentCount', { count: apDetail.payments.length })}
            </span>
          </div>

          <div className="max-h-48 overflow-y-auto">
            <VendorPaymentHistoryTable
              payments={apDetail.payments}
              currency={apDetail.currency}
            />
          </div>
        </Card>

        {/* Timestamps */}
        <div className="mb-4 text-xs text-steel-500">
          {t('accountsPayableDetailModal.metadata', { createdAt: formatDateTime(apDetail.createdAt) })}
        </div>

        {/* Actions */}
        <ModalActions align="between">
          <div className="flex gap-2">
            {canReceivePayment && (
              <Button onClick={handlePayClick} size="sm">
                <Icon name="plus" className="mr-1 h-3 w-3" />
                {t('accountsPayableDetailModal.recordPayment')}
              </Button>
            )}
          </div>
          <Button variant="secondary" onClick={onClose}>
            {t('accountsPayableDetailModal.close')}
          </Button>
        </ModalActions>
      </Modal>

      {/* Payment Modal */}
      {apForPaymentModal && (
        <RecordAPPaymentModal
          ap={apForPaymentModal}
          isOpen={showPaymentModal}
          onClose={handlePaymentModalClose}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}
