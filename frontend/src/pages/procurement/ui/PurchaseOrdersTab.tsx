/**
 * Purchase Orders Tab - Displays all purchase orders.
 *
 * Shows POs across all stages with filtering by status.
 * Click on a row to view PO details with workflow actions.
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  type PurchaseOrderListItem,
  type PurchaseOrderStatus,
  purchaseOrderQueries,
  purchaseOrderRules,
  PurchaseOrderStatusConfig,
} from '@/entities/purchase-order';
import { Badge, Card, Pagination, Spinner, Table } from '@/shared/ui';
import { formatDate, Money } from '@/shared/lib/formatting';
import { PurchaseOrderDetailModal } from '@/widgets';

const PAGE_SIZE = 20;

/**
 * Status badge for purchase order.
 */
function StatusBadge({ status }: { readonly status: PurchaseOrderStatus }) {
  const { t } = useTranslation('purchasing');
  const config = PurchaseOrderStatusConfig[status];
  return (
    <Badge variant={config.color} dot>
      {t(`purchaseOrder.status.${status}`)}
    </Badge>
  );
}

/**
 * Purchase orders tab content.
 */
export function PurchaseOrdersTab() {
  const { t } = useTranslation('purchasing');

  // Local state for filters and pagination
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | null>(null);

  // Modal state
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Handle filter changes with pagination reset
  const handleStatusChange = useCallback((status: PurchaseOrderStatus | null) => {
    setStatusFilter(status);
    setPage(0);
  }, []);

  // Handle row click to open detail modal
  const handleRowClick = useCallback((orderId: number) => {
    setSelectedOrderId(orderId);
  }, []);

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setSelectedOrderId(null);
  }, []);

  // Server state via Query Factory
  const {
    data: ordersData,
    isLoading,
    error,
    refetch,
  } = useQuery(
    purchaseOrderQueries.list({
      page,
      size: PAGE_SIZE,
      status: statusFilter,
      projectId: null,
      vendorId: null,
    })
  );

  const orders = ordersData?.data ?? [];
  const pagination = ordersData?.pagination;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center gap-4">
        {/* Status Filter */}
        <select
          value={statusFilter || ''}
          onChange={e =>
            handleStatusChange(e.target.value ? (e.target.value as PurchaseOrderStatus) : null)
          }
          className="rounded-lg border border-steel-700/50 bg-steel-800/60 px-3 py-2 text-sm text-white focus:border-copper-500 focus:outline-none"
        >
          <option value="">{t('purchaseOrder.list.allStatuses')}</option>
          {Object.entries(PurchaseOrderStatusConfig).map(([status]) => (
            <option key={status} value={status}>
              {t(`purchaseOrder.status.${status}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <Card variant="table" className="p-8 text-center">
          <p className="text-red-400">{t('purchaseOrder.list.loadError')}</p>
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

      {/* Order List */}
      {!isLoading && !error && (
        <>
          <Card className="overflow-hidden">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>{t('table.headers.poNumber')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('table.headers.project')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('table.headers.vendor')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('table.headers.orderDate')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('table.headers.expectedDeliveryDate')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('table.headers.amount')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('table.headers.status')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('table.headers.manager')}</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {orders.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={8} className="py-12 text-center text-steel-400">
                      {t('purchaseOrder.list.empty')}
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  orders.map((order: PurchaseOrderListItem) => {
                    const isOverdue = purchaseOrderRules.isOverdue(order);

                    return (
                      <Table.Row
                        key={order.id}
                        className="cursor-pointer transition-colors hover:bg-steel-800/50"
                        onClick={() => handleRowClick(order.id)}
                      >
                        <Table.Cell>
                          <span className="font-medium text-copper-400">{order.poNumber}</span>
                        </Table.Cell>
                        <Table.Cell className="text-steel-300">{order.jobCode}</Table.Cell>
                        <Table.Cell className="text-steel-300">{order.vendorName}</Table.Cell>
                        <Table.Cell className="text-steel-300">{formatDate(order.orderDate)}</Table.Cell>
                        <Table.Cell className={isOverdue ? 'text-red-400' : 'text-steel-300'}>
                          {formatDate(order.expectedDeliveryDate)}
                        </Table.Cell>
                        <Table.Cell className="font-medium text-white">
                          {Money.format(order.totalAmount, { currency: order.currency })}
                        </Table.Cell>
                        <Table.Cell>
                          <StatusBadge status={order.status} />
                        </Table.Cell>
                        <Table.Cell className="text-steel-300">{order.createdByName}</Table.Cell>
                      </Table.Row>
                    );
                  })
                )}
              </Table.Body>
            </Table>
          </Card>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalItems={pagination.totalElements}
              itemsPerPage={PAGE_SIZE}
              onPageChange={setPage}
              isFirst={pagination.first}
              isLast={pagination.last}
              itemLabel={t('purchaseOrder.title').toLowerCase()}
            />
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedOrderId && (
        <PurchaseOrderDetailModal
          purchaseOrderId={selectedOrderId}
          isOpen={Boolean(selectedOrderId)}
          onClose={handleCloseModal}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
