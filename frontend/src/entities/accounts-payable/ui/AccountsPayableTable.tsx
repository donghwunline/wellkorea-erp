/**
 * Table component for displaying accounts payable.
 *
 * Entity-level component: read-only display only.
 * Action buttons should be added by parent (page/widget) via renderActions.
 */

import { Table, Badge, type BadgeVariant } from '@/shared/ui';
import { formatDate } from '@/shared/lib/formatting/date';
import type { AccountsPayable } from '../model/accounts-payable';
import { accountsPayableRules } from '../model/accounts-payable';
import { AccountsPayableStatusBadge } from './AccountsPayableStatusBadge';

interface AccountsPayableTableProps {
  items: AccountsPayable[];
  onRowClick?: (item: AccountsPayable) => void;
  renderActions?: (item: AccountsPayable) => React.ReactNode;
  showVendor?: boolean;
}

export function AccountsPayableTable({
  items,
  onRowClick,
  renderActions,
  showVendor = true,
}: AccountsPayableTableProps) {
  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>PO Number</Table.HeaderCell>
          {showVendor && <Table.HeaderCell>Vendor</Table.HeaderCell>}
          <Table.HeaderCell className="text-right">Total Amount</Table.HeaderCell>
          <Table.HeaderCell className="text-right">Paid</Table.HeaderCell>
          <Table.HeaderCell className="text-right">Remaining</Table.HeaderCell>
          <Table.HeaderCell>Due Date</Table.HeaderCell>
          <Table.HeaderCell>Status</Table.HeaderCell>
          <Table.HeaderCell>Aging</Table.HeaderCell>
          {renderActions && <Table.HeaderCell className="w-24">Actions</Table.HeaderCell>}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {items.map((item) => (
          <Table.Row
            key={item.id}
            onClick={onRowClick ? () => onRowClick(item) : undefined}
            className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : undefined}
          >
            <Table.Cell className="font-medium">{item.poNumber}</Table.Cell>
            {showVendor && <Table.Cell>{item.vendorName}</Table.Cell>}
            <Table.Cell className="text-right font-mono">
              {accountsPayableRules.formatTotalAmount(item)}
            </Table.Cell>
            <Table.Cell className="text-right font-mono text-green-600">
              {accountsPayableRules.formatTotalPaid(item)}
            </Table.Cell>
            <Table.Cell className="text-right font-mono">
              {accountsPayableRules.formatRemainingBalance(item)}
            </Table.Cell>
            <Table.Cell>
              {item.dueDate ? (
                <span className={item.isOverdue ? 'text-red-600 font-medium' : ''}>
                  {formatDate(item.dueDate)}
                  {item.isOverdue && ` (${item.daysOverdue}d overdue)`}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </Table.Cell>
            <Table.Cell>
              <AccountsPayableStatusBadge status={item.calculatedStatus} />
            </Table.Cell>
            <Table.Cell>
              <AgingBucketBadge bucket={item.agingBucket} />
            </Table.Cell>
            {renderActions && <Table.Cell>{renderActions(item)}</Table.Cell>}
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

/**
 * Helper component for aging bucket display.
 */
function AgingBucketBadge({ bucket }: { bucket: string }) {
  const getVariant = (): BadgeVariant => {
    switch (bucket) {
      case 'CURRENT':
        return 'success';
      case '1_30_DAYS':
        return 'warning';
      case '31_60_DAYS':
      case '61_90_DAYS':
      case 'OVER_90_DAYS':
        return 'danger';
      default:
        return 'steel';
    }
  };

  const getLabel = (): string => {
    switch (bucket) {
      case 'CURRENT':
        return 'Current';
      case '1_30_DAYS':
        return '1-30 days';
      case '31_60_DAYS':
        return '31-60 days';
      case '61_90_DAYS':
        return '61-90 days';
      case 'OVER_90_DAYS':
        return '90+ days';
      default:
        return bucket;
    }
  };

  return <Badge variant={getVariant()}>{getLabel()}</Badge>;
}
