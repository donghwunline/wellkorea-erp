/**
 * Quotation Table.
 *
 * Pure display component for quotation list.
 * Receives data and callbacks via props - no data fetching.
 *
 * Entity UI rules:
 * - No router dependencies (useNavigate, Link)
 * - No mutation hooks
 * - No feature-specific action buttons (use renderActions prop)
 * - Receives all data via props
 */

import { Card, EmptyState, Table } from '@/shared/ui';
import type { QuotationListItem } from '../model/quotation';
import { formatDate } from '@/shared/lib/formatting/date';
import { Money } from '@/shared/lib/formatting/money';
import { QuotationStatusBadge } from './QuotationStatusBadge';

export interface QuotationTableProps {
  /**
   * Quotations to display (list items, not full quotation details).
   */
  quotations: readonly QuotationListItem[];

  /**
   * Called when a row is clicked.
   */
  onRowClick?: (quotation: QuotationListItem) => void;

  /**
   * Optional render function for action buttons.
   * Allows parent to inject feature-specific actions.
   */
  renderActions?: (quotation: QuotationListItem) => React.ReactNode;

  /**
   * Empty state message when no quotations.
   */
  emptyMessage?: string;

  /**
   * Optional additional className.
   */
  className?: string;
}

/**
 * Table component for displaying quotation list.
 *
 * This is a pure display component that:
 * - Renders quotation data in table format
 * - Delegates row clicks via callback
 * - Delegates action rendering via renderActions prop
 *
 * @example
 * ```tsx
 * function QuotationListPage() {
 *   const { data } = useQuotations({ page: 0 });
 *   const navigate = useNavigate();
 *
 *   return (
 *     <QuotationTable
 *       quotations={data?.data ?? []}
 *       onRowClick={(q) => navigate(`/quotations/${q.id}`)}
 *       renderActions={(q) => (
 *         <>
 *           <ViewButton quotationId={q.id} />
 *           {quotationRules.canEdit(q) && <EditButton quotationId={q.id} />}
 *         </>
 *       )}
 *     />
 *   );
 * }
 * ```
 */
export function QuotationTable({
  quotations,
  onRowClick,
  renderActions,
  emptyMessage = 'No quotations found.',
  className,
}: Readonly<QuotationTableProps>) {
  return (
    <Card variant="table" className={className}>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Project / JobCode</Table.HeaderCell>
            <Table.HeaderCell>Version</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Total Amount</Table.HeaderCell>
            <Table.HeaderCell>Created</Table.HeaderCell>
            {renderActions && <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {quotations.length === 0 ? (
            <EmptyState variant="table" colspan={renderActions ? 6 : 5} message={emptyMessage} />
          ) : (
            quotations.map(quotation => (
              <Table.Row
                key={quotation.id}
                onClick={onRowClick ? () => onRowClick(quotation) : undefined}
                className={onRowClick ? 'cursor-pointer hover:bg-steel-800/50' : undefined}
              >
                <Table.Cell>
                  <div>
                    <div className="font-medium text-white">{quotation.projectName}</div>
                    <div className="text-sm text-steel-400">{quotation.jobCode}</div>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-steel-300">v{quotation.version}</span>
                </Table.Cell>
                <Table.Cell>
                  <QuotationStatusBadge status={quotation.status} />
                </Table.Cell>
                <Table.Cell className="text-steel-300">
                  {Money.format(quotation.totalAmount)}
                </Table.Cell>
                <Table.Cell>
                  <div className="text-steel-400 text-sm">
                    <div>{formatDate(quotation.createdAt, 'YYYY-MM-DD')}</div>
                    <div className="text-xs text-steel-500">{quotation.createdByName}</div>
                  </div>
                </Table.Cell>
                {renderActions && (
                  <Table.Cell>
                    <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                      {renderActions(quotation)}
                    </div>
                  </Table.Cell>
                )}
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>
    </Card>
  );
}
