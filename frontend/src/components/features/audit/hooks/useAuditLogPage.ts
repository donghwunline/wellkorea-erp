/**
 * Audit log page-specific hook
 *
 * Manages audit log filters, pagination, and search.
 * Lives in features/audit/hooks because it's coupled to audit feature.
 *
 * NOTE: This hook only manages Page UI State (Tier 2).
 * Server state (Tier 3) is managed by the table component or useAuditLogActions.
 */

import { useCallback, useState } from 'react';
import { usePaginatedSearch } from '@/shared/hooks';

export interface AuditLogFilters {
  username: string;
  action: string;
  startDate: string;
  endDate: string;
}

export interface UseAuditLogPageReturn {
  // Pagination (from generic hook)
  page: number;
  setPage: (page: number) => void;

  // Search (from generic hook) - currently unused but available
  search: string;
  searchInput: string;
  handleSearchChange: (value: string) => void;
  handleSearchSubmit: () => void;
  handleClearSearch: () => void;

  // Audit-specific filters
  filters: AuditLogFilters;
  handleFilterChange: (key: keyof AuditLogFilters, value: string) => void;
  handleClearFilters: () => void;
}

const INITIAL_FILTERS: AuditLogFilters = {
  username: '',
  action: '',
  startDate: '',
  endDate: '',
};

/**
 * Audit log page UI state hook.
 *
 * Combines generic pagination/search with audit-specific filters.
 *
 * @example
 * ```typescript
 * const { page, setPage, filters, handleFilterChange } = useAuditLogPage();
 *
 * <FilterSelect value={filters.action} onChange={v => handleFilterChange('action', v)} />
 * ```
 */
export function useAuditLogPage(): UseAuditLogPageReturn {
  const paginationSearch = usePaginatedSearch();

  // Audit-specific filter state
  const [filters, setFilters] = useState<AuditLogFilters>(INITIAL_FILTERS);

  const handleFilterChange = useCallback(
    (key: keyof AuditLogFilters, value: string) => {
      setFilters(prev => ({ ...prev, [key]: value }));
      paginationSearch.setPage(0); // Reset pagination on filter change
    },
    [paginationSearch]
  );

  const handleClearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    paginationSearch.setPage(0);
  }, [paginationSearch]);

  return {
    ...paginationSearch,
    filters,
    handleFilterChange,
    handleClearFilters,
  };
}
