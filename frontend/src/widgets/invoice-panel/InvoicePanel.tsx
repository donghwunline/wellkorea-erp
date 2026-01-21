/**
 * Invoice Panel Widget
 *
 * Displays invoice information for a project including:
 * - Invoice summary statistics
 * - List of invoices with status and actions
 * - Inline payment recording
 * - Issue/Cancel confirmations
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 */

import { useCallback, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  ConfirmationModal,
  Icon,
  LoadingState,
} from '@/shared/ui';
import {
  type InvoiceSummary,
  invoiceQueries,
  invoiceRules,
  InvoiceTable,
} from '@/entities/invoice';
import { quotationQueries, QuotationStatus } from '@/entities/quotation';
import { useAuth } from '@/entities/auth';
import { useIssueInvoice } from '@/features/invoice/issue';
import { useCancelInvoice } from '@/features/invoice/cancel';
import { InvoiceCreateModal } from './ui/InvoiceCreateModal';
import { InvoiceDetailModal } from './ui/InvoiceDetailModal';
import { InvoiceSummaryStats } from './ui/InvoiceSummaryStats';
import { RecordPaymentModal } from './ui/RecordPaymentModal';

export interface InvoicePanelProps {
  readonly projectId: number;
  readonly onDataChange?: () => void;
}

export function InvoicePanel({ projectId, onDataChange }: InvoicePanelProps) {
  const { t } = useTranslation('widgets');
  const { hasAnyRole } = useAuth();

  // Check if user can manage invoices (Finance/Admin)
  const canManageInvoices = hasAnyRole(['ROLE_ADMIN', 'ROLE_FINANCE']);

  // Fetch invoices for this project
  const {
    data: invoicesPage,
    isLoading: loadingInvoices,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useQuery(invoiceQueries.list({ projectId, size: 100 }));
  const invoices = invoicesPage?.data ?? [];

  // Fetch accepted quotation to check if invoices can be created
  const { data: quotationsData, isLoading: loadingQuotations } = useQuery(
    quotationQueries.list({
      page: 0,
      size: 1,
      search: '',
      status: QuotationStatus.ACCEPTED,
      projectId,
    })
  );

  const hasAcceptedQuotation = useMemo(() => {
    return quotationsData && quotationsData.data.length > 0;
  }, [quotationsData]);

  // Get the latest accepted quotation ID for outdated detection
  const latestAcceptedQuotationId = useMemo(() => {
    if (quotationsData && quotationsData.data.length > 0) {
      return quotationsData.data[0].id;
    }
    return null;
  }, [quotationsData]);

  // Modal states
  const [issueConfirm, setIssueConfirm] = useState<InvoiceSummary | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<InvoiceSummary | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<InvoiceSummary | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailInvoiceId, setDetailInvoiceId] = useState<number | null>(null);

  // Success message with auto-dismiss
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSuccess = useCallback((message: string) => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    setSuccessMessage(message);
    successTimeoutRef.current = setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  }, []);

  // Mutations
  const { mutate: issueInvoice } = useIssueInvoice({
    onSuccess: () => {
      showSuccess(t('invoicePanel.successMessages.issued'));
      setIssueConfirm(null);
      void refetchInvoices();
      onDataChange?.();
    },
  });

  const { mutate: cancelInvoice } = useCancelInvoice({
    onSuccess: () => {
      showSuccess(t('invoicePanel.successMessages.cancelled'));
      setCancelConfirm(null);
      void refetchInvoices();
      onDataChange?.();
    },
  });

  // Handlers
  const handleCreateInvoice = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleCreateModalSuccess = useCallback(() => {
    showSuccess(t('invoicePanel.successMessages.created'));
    void refetchInvoices();
    onDataChange?.();
  }, [refetchInvoices, onDataChange, showSuccess, t]);

  const handleViewInvoice = useCallback((invoice: InvoiceSummary) => {
    setDetailInvoiceId(invoice.id);
  }, []);

  const handleIssueConfirm = useCallback(() => {
    if (issueConfirm) {
      issueInvoice(issueConfirm.id);
    }
  }, [issueConfirm, issueInvoice]);

  const handleCancelConfirm = useCallback(() => {
    if (cancelConfirm) {
      cancelInvoice(cancelConfirm.id);
    }
  }, [cancelConfirm, cancelInvoice]);

  const handlePaymentSuccess = useCallback(() => {
    showSuccess(t('invoicePanel.successMessages.paymentRecorded'));
    void refetchInvoices();
    onDataChange?.();
  }, [refetchInvoices, onDataChange, showSuccess, t]);

  // Render actions for each invoice row
  const renderActions = useCallback(
    (invoice: InvoiceSummary) => {
      const canIssue = invoiceRules.canIssue(invoice);
      const canPayment = invoiceRules.canReceivePayment(invoice);
      const canCancel = invoiceRules.canCancel(invoice);

      return (
        <div className="flex items-center justify-end gap-1">
          {canManageInvoices && canIssue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIssueConfirm(invoice);
              }}
              title={t('invoicePanel.actions.issueInvoice')}
            >
              <Icon name="paper-airplane" className="h-4 w-4" />
            </Button>
          )}
          {canManageInvoices && canPayment && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setPaymentInvoice(invoice);
              }}
              title={t('invoicePanel.actions.recordPayment')}
            >
              <Icon name="banknotes" className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewInvoice(invoice);
            }}
            title={t('invoicePanel.actions.viewDetails')}
          >
            <Icon name="eye" className="h-4 w-4" />
          </Button>
          {canManageInvoices && canCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setCancelConfirm(invoice);
              }}
              title={t('invoicePanel.actions.cancelInvoice')}
              className="text-red-400 hover:text-red-300"
            >
              <Icon name="x-circle" className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    },
    [canManageInvoices, handleViewInvoice, t]
  );

  const isLoading = loadingInvoices || loadingQuotations;

  if (isLoading) {
    return (
      <Card>
        <LoadingState message={t('invoicePanel.loading')} />
      </Card>
    );
  }

  if (invoicesError) {
    return (
      <Alert variant="error">
        {t('invoicePanel.loadError', { message: invoicesError.message })}
      </Alert>
    );
  }

  // Empty state - no accepted quotation
  if (!hasAcceptedQuotation) {
    return (
      <Card className="p-12 text-center">
        <Icon name="document" className="mx-auto mb-4 h-12 w-12 text-steel-600" />
        <h3 className="text-lg font-semibold text-white">{t('invoicePanel.noQuotation')}</h3>
        <p className="mt-2 text-steel-500">
          {t('invoicePanel.noQuotationDesc')}
        </p>
      </Card>
    );
  }

  // Empty state - no invoices yet
  if (invoices.length === 0) {
    return (
      <>
        <Card className="p-12 text-center">
          <Icon name="banknotes" className="mx-auto mb-4 h-12 w-12 text-steel-600" />
          <h3 className="text-lg font-semibold text-white">{t('invoicePanel.noInvoices')}</h3>
          <p className="mt-2 text-steel-500">
            {t('invoicePanel.noInvoicesDesc')}
          </p>
          {canManageInvoices && (
            <Button variant="primary" className="mt-6" onClick={handleCreateInvoice}>
              <Icon name="plus" className="h-4 w-4" />
              {t('invoicePanel.createInvoice')}
            </Button>
          )}
        </Card>

        {/* Create Invoice Modal - must be rendered for button to work */}
        <InvoiceCreateModal
          projectId={projectId}
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateModalSuccess}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Summary Stats */}
      <InvoiceSummaryStats invoices={invoices} />

      {/* Actions */}
      {canManageInvoices && (
        <div className="flex justify-end">
          <Button variant="primary" onClick={handleCreateInvoice}>
            <Icon name="plus" className="h-4 w-4" />
            {t('invoicePanel.createInvoice')}
          </Button>
        </div>
      )}

      {/* Invoices Table */}
      <InvoiceTable
        invoices={invoices}
        onRowClick={handleViewInvoice}
        renderActions={renderActions}
        latestAcceptedQuotationId={latestAcceptedQuotationId}
      />

      {/* Issue Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!issueConfirm}
        onClose={() => setIssueConfirm(null)}
        onConfirm={handleIssueConfirm}
        title={t('invoicePanel.confirmIssue')}
        message={
          issueConfirm
            ? t('invoicePanel.confirmIssueMessage', { invoiceNumber: issueConfirm.invoiceNumber })
            : ''
        }
        confirmLabel={t('invoicePanel.issueButton')}
        variant="warning"
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!cancelConfirm}
        onClose={() => setCancelConfirm(null)}
        onConfirm={handleCancelConfirm}
        title={t('invoicePanel.confirmCancel')}
        message={
          cancelConfirm
            ? t('invoicePanel.confirmCancelMessage', { invoiceNumber: cancelConfirm.invoiceNumber })
            : ''
        }
        confirmLabel={t('invoicePanel.cancelButton')}
        variant="danger"
      />

      {/* Record Payment Modal */}
      {paymentInvoice && (
        <RecordPaymentModal
          invoice={paymentInvoice}
          isOpen={true}
          onClose={() => setPaymentInvoice(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Create Invoice Modal */}
      <InvoiceCreateModal
        projectId={projectId}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateModalSuccess}
      />

      {/* Invoice Detail Modal */}
      {detailInvoiceId !== null && (
        <InvoiceDetailModal
          invoiceId={detailInvoiceId}
          isOpen={true}
          onClose={() => setDetailInvoiceId(null)}
          onSuccess={() => {
            void refetchInvoices();
            onDataChange?.();
          }}
        />
      )}
    </div>
  );
}
