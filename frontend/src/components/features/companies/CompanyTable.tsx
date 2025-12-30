/**
 * Company Management Table - Smart Feature Component
 *
 * Responsibilities:
 * - Fetch company list data from companyService
 * - Support role-based filtering (CUSTOMER, VENDOR, OUTSOURCE)
 * - Display companies in table format
 * - Delegate actions to parent via callbacks
 * - Respond to refreshTrigger changes
 *
 * This component owns Server State (Tier 3) for the company list.
 */

import { useCallback, useEffect, useState } from 'react';
import { companyService, ROLE_TYPE_LABELS } from '@/services';
import type { CompanySummary, RoleType } from '@/services';
import type { PaginationMetadata } from '@/shared/api/types';
import { formatDate } from '@/shared/utils';
import {
  Badge,
  type BadgeVariant,
  Card,
  EmptyState,
  Icon,
  IconButton,
  LoadingState,
  Pagination,
  Table,
} from '@/components/ui';

// Role type badge variant mapping
const ROLE_BADGE_VARIANTS: Record<RoleType, BadgeVariant> = {
  CUSTOMER: 'info',
  VENDOR: 'success',
  OUTSOURCE: 'purple',
};

export interface CompanyTableProps {
  /** Current page (0-indexed) */
  page: number;
  /** Search query string */
  search: string;
  /** Filter by role type (optional) */
  roleType?: RoleType;
  /** Increment to trigger data refetch (optional) */
  refreshTrigger?: number;
  /** Called when page changes */
  onPageChange: (page: number) => void;
  /** Called when user clicks view */
  onView: (company: CompanySummary) => void;
  /** Called when user clicks edit */
  onEdit?: (company: CompanySummary) => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
}

/**
 * Smart table component that fetches and displays companies.
 */
export function CompanyTable({
  page,
  search,
  roleType,
  refreshTrigger,
  onPageChange,
  onView,
  onEdit,
  onError,
}: Readonly<CompanyTableProps>) {
  // Server State (Tier 3) - managed here in feature component
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch companies
  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await companyService.getCompanies({
        page,
        size: 10,
        search: search || undefined,
        roleType,
      });
      setCompanies(result.data);
      setPagination(result.pagination);
    } catch {
      const errorMsg = 'Failed to load companies';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, roleType, onError]);

  // Refetch when page, search, roleType, or refreshTrigger changes
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies, refreshTrigger]);

  // Render loading state
  if (isLoading) {
    return (
      <Card variant="table">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Company Name</Table.HeaderCell>
              <Table.HeaderCell>Registration No.</Table.HeaderCell>
              <Table.HeaderCell>Contact</Table.HeaderCell>
              <Table.HeaderCell>Roles</Table.HeaderCell>
              <Table.HeaderCell>Created</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <LoadingState variant="table" colspan={6} message="Loading companies..." />
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
            onClick={() => fetchCompanies()}
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
      {/* Companies Table */}
      <Card variant="table">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Company Name</Table.HeaderCell>
              <Table.HeaderCell>Registration No.</Table.HeaderCell>
              <Table.HeaderCell>Contact</Table.HeaderCell>
              <Table.HeaderCell>Roles</Table.HeaderCell>
              <Table.HeaderCell>Created</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {companies.length === 0 ? (
              <EmptyState
                variant="table"
                colspan={6}
                message={
                  search
                    ? 'No companies found matching your search.'
                    : roleType
                      ? `No ${ROLE_TYPE_LABELS[roleType].toLowerCase()} found.`
                      : 'No companies found.'
                }
              />
            ) : (
              companies.map(company => (
                <Table.Row key={company.id}>
                  <Table.Cell>
                    <div className="font-medium text-white">{company.name}</div>
                    {company.email && (
                      <div className="text-sm text-steel-400">{company.email}</div>
                    )}
                  </Table.Cell>
                  <Table.Cell className="font-mono text-sm text-steel-400">
                    {company.registrationNumber || '-'}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="text-steel-300">{company.contactPerson || '-'}</div>
                    {company.phone && (
                      <div className="text-sm text-steel-400">{company.phone}</div>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-wrap gap-1">
                      {company.roles.map(role => (
                        <Badge key={role.id} variant={ROLE_BADGE_VARIANTS[role.roleType]} size="sm">
                          {ROLE_TYPE_LABELS[role.roleType]}
                        </Badge>
                      ))}
                    </div>
                  </Table.Cell>
                  <Table.Cell className="text-steel-400">
                    {formatDate(company.createdAt)}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex justify-end gap-1">
                      <IconButton
                        onClick={() => onView(company)}
                        aria-label="View company"
                        title="View company"
                      >
                        <Icon name="eye" className="h-4 w-4" />
                      </IconButton>
                      {onEdit && (
                        <IconButton
                          onClick={() => onEdit(company)}
                          aria-label="Edit company"
                          title="Edit company"
                        >
                          <Icon name="pencil" className="h-4 w-4" />
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
            itemLabel="companies"
          />
        </div>
      )}
    </>
  );
}
