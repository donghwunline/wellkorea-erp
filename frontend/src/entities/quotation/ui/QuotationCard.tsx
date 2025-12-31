/**
 * Quotation Card.
 *
 * Display component for quotation details and line items.
 * Pure presentational - receives all data via props.
 *
 * Entity UI rules:
 * - No router dependencies
 * - No mutation hooks
 * - Receives all data via props
 */

import { Alert, Card, Table } from '@/shared/ui';
import type { Quotation } from '../model';
import { lineItemRules } from '../model';
import { formatDate } from '@/shared/formatting/date';
import { Money } from '@/shared/formatting/money';
import { QuotationStatusBadge } from './QuotationStatusBadge';

export interface QuotationCardProps {
  /**
   * Quotation to display.
   */
  quotation: Quotation;

  /**
   * Whether to show the status badge in the header.
   * @default true
   */
  showStatusBadge?: boolean;

  /**
   * Whether to include time in date formatting.
   * @default false
   */
  includeTimeInDates?: boolean;

  /**
   * Optional additional className.
   */
  className?: string;
}

/**
 * Quotation details and line items display card.
 *
 * Features:
 * - Quotation metadata display (job code, project, dates, amounts)
 * - Line items table with product details
 * - Total amount summary
 * - Optional status badge display
 * - Optional notes and rejection reason display
 *
 * @example
 * ```tsx
 * function QuotationDetail({ id }: { id: number }) {
 *   const { data: quotation, isLoading } = useQuotation({ id });
 *
 *   if (isLoading) return <Spinner />;
 *   if (!quotation) return null;
 *
 *   return <QuotationCard quotation={quotation} />;
 * }
 * ```
 */
export function QuotationCard({
  quotation,
  showStatusBadge = true,
  includeTimeInDates = false,
  className,
}: Readonly<QuotationCardProps>) {
  const dateFormat = includeTimeInDates ? 'YYYY-MM-DD HH:mm' as const : 'YYYY-MM-DD' as const;

  return (
    <div className={className}>
      {/* Quotation Details Card */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">Quotation Details</h3>
          {showStatusBadge && <QuotationStatusBadge status={quotation.status} />}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <span className="text-steel-500">Job Code</span>
            <p className="font-medium text-white">{quotation.jobCode}</p>
          </div>
          <div>
            <span className="text-steel-500">Version</span>
            <p className="text-steel-300">v{quotation.version}</p>
          </div>
          <div>
            <span className="text-steel-500">Project</span>
            <p className="text-steel-300">{quotation.projectName}</p>
          </div>
          <div>
            <span className="text-steel-500">Created By</span>
            <p className="text-steel-300">{quotation.createdByName}</p>
          </div>
          <div>
            <span className="text-steel-500">Created At</span>
            <p className="text-steel-300">{formatDate(quotation.createdAt, dateFormat)}</p>
          </div>
          <div>
            <span className="text-steel-500">Quotation Date</span>
            <p className="text-steel-300">{formatDate(quotation.quotationDate, dateFormat)}</p>
          </div>
          <div>
            <span className="text-steel-500">Validity</span>
            <p className="text-steel-300">{quotation.validityDays} days</p>
          </div>
          <div>
            <span className="text-steel-500">Expiry Date</span>
            <p className="text-steel-300">{formatDate(quotation.expiryDate, dateFormat)}</p>
          </div>
        </div>

        {quotation.notes && (
          <div className="mt-4 border-t border-steel-700/50 pt-4">
            <span className="text-sm text-steel-500">Notes</span>
            <p className="mt-1 text-steel-300">{quotation.notes}</p>
          </div>
        )}

        {quotation.rejectionReason && (
          <Alert variant="error" className="mt-4" title="Rejection Reason">
            {quotation.rejectionReason}
          </Alert>
        )}
      </Card>

      {/* Line Items Table */}
      <Card variant="table" className="mt-6">
        <div className="border-b border-steel-700/50 bg-steel-800/50 px-4 py-3">
          <h3 className="font-medium text-white">Line Items</h3>
        </div>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>#</Table.HeaderCell>
              <Table.HeaderCell>Product</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Quantity</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Unit Price</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Total</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {quotation.lineItems && quotation.lineItems.length > 0 ? (
              quotation.lineItems.map((item, index) => (
                <Table.Row key={item.id}>
                  <Table.Cell className="text-steel-400">{index + 1}</Table.Cell>
                  <Table.Cell>
                    <div>
                      <div className="font-medium text-white">{item.productName}</div>
                      <div className="text-sm text-steel-400">{item.productSku}</div>
                    </div>
                  </Table.Cell>
                  <Table.Cell className="text-right text-steel-300">
                    {item.quantity.toLocaleString()}
                  </Table.Cell>
                  <Table.Cell className="text-right text-steel-300">
                    {Money.format(item.unitPrice)}
                  </Table.Cell>
                  <Table.Cell className="text-right font-medium text-copper-400">
                    {Money.format(lineItemRules.getLineTotal(item))}
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={5} className="text-center text-steel-400">
                  No line items
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>

        {/* Total */}
        <div className="border-t border-steel-700/50 bg-steel-800/30 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-white">Total Amount</span>
            <span className="text-xl font-bold text-copper-400">
              {Money.format(quotation.totalAmount)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
