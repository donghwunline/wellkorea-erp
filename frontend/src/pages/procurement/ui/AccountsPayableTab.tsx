/**
 * Accounts Payable Tab - Displays all AP records with calculated status.
 *
 * Shows AP records grouped by status with filtering options.
 * Click on a row to view AP details with payment actions.
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  type AccountsPayable,
  type CalculatedAPStatus,
  accountsPayableQueries,
  AccountsPayableTable,
} from '@/entities/accounts-payable';
import { RecordAPPaymentModal } from '@/features/accounts-payable/record-payment';
import { Card, Spinner, Button } from '@/shared/ui';

const PAGE_SIZE = 20;

/**
 * Accounts payable tab content.
 */
export function AccountsPayableTab() {
  const { t } = useTranslation('purchasing');

  // Local state for filters
  const [page] = useState(0);
  const [statusFilter, setStatusFilter] = useState<CalculatedAPStatus | undefined>(undefined);
  const [overdueOnly, setOverdueOnly] = useState<boolean | undefined>(undefined);

  // Modal state for recording payments
  const [selectedAP, setSelectedAP] = useState<AccountsPayable | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Handle filter changes
  const handleStatusChange = useCallback((status: CalculatedAPStatus | '') => {
    setStatusFilter(status || undefined);
  }, []);

  const handleOverdueToggle = useCallback(() => {
    setOverdueOnly(prev => (prev ? undefined : true));
  }, []);

  // Handle opening payment modal
  const handlePayClick = useCallback((ap: AccountsPayable) => {
    setSelectedAP(ap);
    setIsPaymentModalOpen(true);
  }, []);

  // Handle closing payment modal
  const handlePaymentModalClose = useCallback(() => {
    setIsPaymentModalOpen(false);
    setSelectedAP(null);
  }, []);

  // Handle successful payment - data refreshes automatically via cache invalidation
  const handlePaymentSuccess = useCallback(() => {
    // The mutation hook invalidates queries, so data will refresh automatically
  }, []);

  // Server state via Query Factory
  const {
    data: items,
    isLoading,
    error,
    refetch,
  } = useQuery(accountsPayableQueries.list(page, PAGE_SIZE, undefined, statusFilter, overdueOnly));

  // Handle row click
  const handleRowClick = useCallback((item: AccountsPayable) => {
    // TODO: Open detail modal or navigate to detail page
    console.log('Selected AP:', item);
  }, []);

  // Render actions for each row
  const renderActions = useCallback(
    (item: AccountsPayable) => {
      if (item.calculatedStatus === 'PAID') {
        return null;
      }
      return (
        <Button
          size="sm"
          variant="secondary"
          onClick={e => {
            e.stopPropagation(); // Prevent row click
            handlePayClick(item);
          }}
        >
          {t('accountsPayable.actions.pay')}
        </Button>
      );
    },
    [t, handlePayClick]
  );

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center gap-4">
        {/* Status Filter */}
        <select
          value={statusFilter || ''}
          onChange={e => handleStatusChange(e.target.value as CalculatedAPStatus | '')}
          className="rounded-lg border border-steel-700/50 bg-steel-800/60 px-3 py-2 text-sm text-white focus:border-copper-500 focus:outline-none"
        >
          <option value="">{t('accountsPayable.list.allStatuses')}</option>
          <option value="PENDING">{t('accountsPayable.status.PENDING')}</option>
          <option value="PARTIALLY_PAID">{t('accountsPayable.status.PARTIALLY_PAID')}</option>
          <option value="PAID">{t('accountsPayable.status.PAID')}</option>
        </select>

        {/* Overdue Toggle */}
        <button
          onClick={handleOverdueToggle}
          className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
            overdueOnly
              ? 'border-red-500/50 bg-red-500/20 text-red-400'
              : 'border-steel-700/50 bg-steel-800/60 text-white hover:border-copper-500'
          }`}
        >
          {t('accountsPayable.list.overdueOnly')}
        </button>
      </div>

      {/* Error */}
      {error && (
        <Card variant="table" className="p-8 text-center">
          <p className="text-red-400">{t('accountsPayable.list.loadError')}</p>
          <button onClick={() => refetch()} className="mt-4 text-sm text-copper-500 hover:underline">
            {t('common.retry')}
          </button>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* AP List */}
      {!isLoading && !error && (
        <Card className="overflow-hidden">
          {items && items.length > 0 ? (
            <AccountsPayableTable
              items={items}
              onRowClick={handleRowClick}
              renderActions={renderActions}
            />
          ) : (
            <div className="py-12 text-center text-steel-400">{t('accountsPayable.list.empty')}</div>
          )}
        </Card>
      )}

      {/* Payment Modal */}
      {selectedAP && (
        <RecordAPPaymentModal
          ap={selectedAP}
          isOpen={isPaymentModalOpen}
          onClose={handlePaymentModalClose}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
