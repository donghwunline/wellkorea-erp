/**
 * Company Management Panel Widget.
 *
 * Composite component for displaying and managing companies.
 * Combines entity display with feature actions.
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 *
 * Features:
 * - Display company list with search and filter
 * - Navigate to company details
 * - Create new company action
 */

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Icon, Input, Spinner, Pagination } from '@/shared/ui';

// Entity imports
import {
  CompanyTable,
  companyQueries,
  type CompanyListItem,
  type RoleType,
  ROLE_TYPE_LABELS,
} from '@/entities/company';

export interface CompanyManagementPanelProps {
  /**
   * Optional role type filter to show only companies with specific role.
   */
  readonly roleTypeFilter?: RoleType;

  /**
   * Optional title for the panel.
   */
  readonly title?: string;

  /**
   * Whether to show create button.
   */
  readonly showCreateButton?: boolean;

  /**
   * Base path for navigation.
   * @default '/companies'
   */
  readonly basePath?: string;

  /**
   * Callback when a company is selected.
   */
  readonly onCompanySelect?: (company: CompanyListItem) => void;
}

/**
 * Company management panel with list, search, and actions.
 *
 * @example
 * ```tsx
 * function CompaniesPage() {
 *   return <CompanyManagementPanel showCreateButton />;
 * }
 *
 * // Filter by role
 * function CustomersPage() {
 *   return (
 *     <CompanyManagementPanel
 *       roleTypeFilter="CUSTOMER"
 *       title="Customers"
 *       basePath="/customers"
 *     />
 *   );
 * }
 * ```
 */
export function CompanyManagementPanel({
  roleTypeFilter,
  title,
  showCreateButton = true,
  basePath = '/companies',
  onCompanySelect,
}: CompanyManagementPanelProps) {
  const navigate = useNavigate();

  // Search and pagination state
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // Fetch companies
  const {
    data: companiesData,
    isLoading,
    error,
    refetch,
  } = useQuery(companyQueries.list({
    page,
    size: pageSize,
    search,
    roleType: roleTypeFilter ?? null,
  }));

  // Handle row click
  const handleRowClick = useCallback(
    (company: CompanyListItem) => {
      if (onCompanySelect) {
        onCompanySelect(company);
      } else {
        navigate(`${basePath}/${company.id}`);
      }
    },
    [navigate, basePath, onCompanySelect]
  );

  // Handle create
  const handleCreate = useCallback(() => {
    navigate(`${basePath}/create`);
  }, [navigate, basePath]);

  // Handle search with debounce reset
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0); // Reset to first page on search
  }, []);

  // Determine title
  const displayTitle = title ?? (roleTypeFilter ? ROLE_TYPE_LABELS[roleTypeFilter] : '회사 관리');

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-12 text-center">
        <Spinner className="mx-auto h-8 w-8" />
        <p className="mt-4 text-steel-400">회사 목록을 불러오는 중...</p>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="p-12 text-center">
        <Icon name="x-circle" className="mx-auto mb-4 h-12 w-12 text-red-500" />
        <p className="mb-4 text-red-400">{error.message}</p>
        <Button variant="secondary" onClick={() => void refetch()}>
          다시 시도
        </Button>
      </Card>
    );
  }

  const companies = companiesData?.data ?? [];
  const pagination = companiesData?.pagination;
  const totalPages = pagination?.totalPages ?? 0;
  const totalElements = pagination?.totalElements ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{displayTitle}</h2>
          <p className="text-sm text-steel-400">
            총 {totalElements}개의 회사
          </p>
        </div>

        {showCreateButton && (
          <Button onClick={handleCreate}>
            <Icon name="plus" className="mr-2 h-4 w-4" />
            회사 등록
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="회사명, 사업자번호, 담당자로 검색..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Table */}
      <CompanyTable
        companies={companies}
        onRowClick={handleRowClick}
        emptyMessage={
          search
            ? `"${search}"에 대한 검색 결과가 없습니다.`
            : '등록된 회사가 없습니다.'
        }
        renderActions={(company) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`${basePath}/${company.id}`)}
          >
            <Icon name="eye" className="h-4 w-4" />
          </Button>
        )}
      />

      {/* Pagination */}
      {totalPages > 1 && pagination && (
        <Pagination
          currentPage={page}
          totalItems={totalElements}
          itemsPerPage={pageSize}
          onPageChange={setPage}
          isFirst={pagination.first}
          isLast={pagination.last}
          itemLabel="회사"
        />
      )}
    </div>
  );
}
