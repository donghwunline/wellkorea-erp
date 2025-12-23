/**
 * Quotation Table - Smart Feature Component
 *
 * Responsibilities:
 * - Fetch quotation list data from quotationService
 * - Display quotations in table format
 * - Delegate actions to parent via callbacks
 * - Respond to refreshTrigger changes
 *
 * This component owns Server State (Tier 3) for the quotation list.
 */

import { useCallback, useEffect, useState } from 'react';
import { quotationService } from '@/services';
import type { QuotationDetails, QuotationStatus } from '@/services';
import type { PaginationMetadata } from '@/api/types';
import { formatDate, formatCurrency } from '@/shared/utils';
import {
  Badge,
  Card,
  EmptyState,
  Icon,
  IconButton,
  LoadingState,
  Pagination,
  Table,
} from '@/components/ui';
import { QUOTATION_STATUS_BADGE_VARIANTS, QUOTATION_STATUS_LABELS } from './quotationUtils';

export interface QuotationTableProps {
  /** Current page (0-indexed) */
  page: number;
  /** Search query string */
  search?: string;
  /** Filter by status */
  status?: QuotationStatus;
  /** Filter by project ID */
  projectId?: number;
  /** Increment to trigger data refetch */
  refreshTrigger: number;
  /** Called when page changes */
  onPageChange: (page: number) => void;
  /** Called when user clicks view */
  onView: (quotation: QuotationDetails) => void;
  /** Called when user clicks edit (only for DRAFT) */
  onEdit?: (quotation: QuotationDetails) => void;
  /** Called when user clicks submit for approval (only for DRAFT) */
  onSubmit?: (quotation: QuotationDetails) => void;
  /** Called when user clicks create version */
  onCreateVersion?: (quotation: QuotationDetails) => void;
  /** Called when user clicks download PDF (only for non-DRAFT) */
  onDownloadPdf?: (quotation: QuotationDetails) => void;
  /** Called when user clicks send email (only for APPROVED or SENT) */
  onSendEmail?: (quotation: QuotationDetails) => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
}

/**
 * Smart table component that fetches and displays quotations.
 */
export function QuotationTable({
  page,
  search,
  status,
  projectId,
  refreshTrigger,
  onPageChange,
  onView,
  onEdit,
  onSubmit,
  onCreateVersion,
  onDownloadPdf,
  onSendEmail,
  onError,
}: Readonly<QuotationTableProps>) {
  // Server State (Tier 3) - managed here in feature component
  const [quotations, setQuotations] = useState<QuotationDetails[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch quotations
  const fetchQuotations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await quotationService.getQuotations({
        page,
        size: 10,
        status: status || undefined,
        projectId: projectId || undefined,
      });
      setQuotations(result.data);
      setPagination(result.pagination);
    } catch {
      const errorMsg = 'Failed to load quotations';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [page, status, projectId, onError]);

  // Refetch when dependencies change
  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations, refreshTrigger, search]);

  // Render loading state
  if (isLoading) {
    return (
      <Card variant="table">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Project / JobCode</Table.HeaderCell>
              <Table.HeaderCell>Version</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Total Amount</Table.HeaderCell>
              <Table.HeaderCell>Created</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <LoadingState variant="table" colspan={6} message="Loading quotations..." />
          </Table.Body>
        </Table>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card variant="table">
        <div className="p-8 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => fetchQuotations()}
            className="mt-4 text-sm text-copper-500 hover:underline"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* Quotations Table */}
      <Card variant="table">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Project / JobCode</Table.HeaderCell>
              <Table.HeaderCell>Version</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Total Amount</Table.HeaderCell>
              <Table.HeaderCell>Created</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {quotations.length === 0 ? (
              <EmptyState
                variant="table"
                colspan={6}
                message={status ? 'No quotations found with selected status.' : 'No quotations found.'}
              />
            ) : (
              quotations.map(quotation => (
                <Table.Row key={quotation.id}>
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
                    <Badge variant={QUOTATION_STATUS_BADGE_VARIANTS[quotation.status]}>
                      {QUOTATION_STATUS_LABELS[quotation.status]}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="text-steel-300">
                    {formatCurrency(quotation.totalAmount)}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="text-steel-400 text-sm">
                      <div>{formatDate(quotation.createdAt)}</div>
                      <div className="text-xs text-steel-500">{quotation.createdByName}</div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex justify-end gap-2">
                      {/* View - always available */}
                      <IconButton
                        onClick={() => onView(quotation)}
                        aria-label="View quotation"
                        title="View quotation"
                      >
                        <Icon name="eye" className="h-4 w-4" />
                      </IconButton>

                      {/* Edit - only for DRAFT */}
                      {quotation.status === 'DRAFT' && onEdit && (
                        <IconButton
                          onClick={() => onEdit(quotation)}
                          aria-label="Edit quotation"
                          title="Edit quotation"
                        >
                          <Icon name="pencil" className="h-4 w-4" />
                        </IconButton>
                      )}

                      {/* Submit for approval - only for DRAFT */}
                      {quotation.status === 'DRAFT' && onSubmit && (
                        <IconButton
                          onClick={() => onSubmit(quotation)}
                          variant="primary"
                          aria-label="Submit for approval"
                          title="Submit for approval"
                        >
                          <Icon name="paper-airplane" className="h-4 w-4" />
                        </IconButton>
                      )}

                      {/* Download PDF - only for non-DRAFT */}
                      {quotation.status !== 'DRAFT' && onDownloadPdf && (
                        <IconButton
                          onClick={() => onDownloadPdf(quotation)}
                          aria-label="Download PDF"
                          title="Download PDF"
                        >
                          <Icon name="document-arrow-down" className="h-4 w-4" />
                        </IconButton>
                      )}

                      {/* Send email - only for APPROVED or SENT */}
                      {['APPROVED', 'SENT'].includes(quotation.status) && onSendEmail && (
                        <IconButton
                          onClick={() => onSendEmail(quotation)}
                          aria-label="Send email"
                          title="Send email"
                        >
                          <Icon name="envelope" className="h-4 w-4" />
                        </IconButton>
                      )}

                      {/* Create new version - available for APPROVED, SENT, ACCEPTED */}
                      {['APPROVED', 'SENT', 'ACCEPTED'].includes(quotation.status) &&
                        onCreateVersion && (
                          <IconButton
                            onClick={() => onCreateVersion(quotation)}
                            aria-label="Create new version"
                            title="Create new version"
                          >
                            <Icon name="document-duplicate" className="h-4 w-4" />
                          </IconButton>
                        )}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalItems={pagination.totalElements}
            itemsPerPage={pagination.size}
            onPageChange={onPageChange}
            isFirst={pagination.first}
            isLast={pagination.last}
            itemLabel="quotations"
          />
        </div>
      )}
    </>
  );
}
