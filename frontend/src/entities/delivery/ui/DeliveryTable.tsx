/**
 * Delivery table component for listing deliveries.
 * Read-only display - actions delegated via callbacks.
 */

import { Table, Icon } from '@/shared/ui';
import type { Delivery } from '../model/delivery';
import { DeliveryStatusBadge } from './DeliveryStatusBadge';
import { formatDate } from '@/shared/lib/formatting';

interface DeliveryTableProps {
  deliveries: Delivery[];
  onRowClick?: (delivery: Delivery) => void;
  /** Render custom actions for each row */
  renderActions?: (delivery: Delivery) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
}

export function DeliveryTable({
  deliveries,
  onRowClick,
  renderActions,
  loading = false,
  emptyMessage = 'No deliveries found.',
}: DeliveryTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copper-500" />
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <div className="py-12 text-center">
        <Icon name="truck" className="mx-auto mb-4 h-12 w-12 text-steel-600" />
        <p className="text-steel-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Delivery Date</Table.HeaderCell>
          <Table.HeaderCell>Status</Table.HeaderCell>
          <Table.HeaderCell>Items</Table.HeaderCell>
          <Table.HeaderCell>Delivered By</Table.HeaderCell>
          <Table.HeaderCell>Created</Table.HeaderCell>
          {renderActions && <Table.HeaderCell className="w-20">Actions</Table.HeaderCell>}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {deliveries.map(delivery => (
          <Table.Row
            key={delivery.id}
            onClick={onRowClick ? () => onRowClick(delivery) : undefined}
            className={onRowClick ? 'cursor-pointer hover:bg-steel-800/50' : ''}
          >
            <Table.Cell>{formatDate(delivery.deliveryDate)}</Table.Cell>
            <Table.Cell>
              <DeliveryStatusBadge status={delivery.status} />
            </Table.Cell>
            <Table.Cell>
              <span className="text-steel-300">{delivery.lineItems.length} items</span>
            </Table.Cell>
            <Table.Cell>{delivery.deliveredByName}</Table.Cell>
            <Table.Cell className="text-steel-400">
              {formatDate(delivery.createdAt)}
            </Table.Cell>
            {renderActions && (
              <Table.Cell onClick={e => e.stopPropagation()}>
                {renderActions(delivery)}
              </Table.Cell>
            )}
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}
