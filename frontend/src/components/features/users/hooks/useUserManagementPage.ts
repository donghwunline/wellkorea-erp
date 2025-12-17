/**
 * User management page-specific hook
 *
 * Composes generic usePaginatedSearch with user-management-specific logic.
 * Lives in features/users/hooks because it's coupled to user management feature.
 *
 * NOTE: This hook only manages Page UI State (Tier 2).
 * Server state (Tier 3) is managed by useUserManagementActions or the table component.
 */

import { usePaginatedSearch } from '@/shared/hooks';

export interface UseUserManagementPageReturn {
  // Pagination (from generic hook)
  page: number;
  setPage: (page: number) => void;

  // Search (from generic hook)
  search: string;
  searchInput: string;
  handleSearchChange: (value: string) => void;
  handleSearchSubmit: () => void;
  handleClearSearch: () => void;
}

/**
 * User management page UI state hook.
 *
 * Currently wraps usePaginatedSearch. Can be extended with
 * user-management-specific filters (e.g., role filter, status filter).
 *
 * @example
 * ```typescript
 * const { page, search, searchInput, handleSearchChange } = useUserManagementPage();
 * ```
 */
export function useUserManagementPage(): UseUserManagementPageReturn {
  const paginationSearch = usePaginatedSearch();

  // Future: Add user-management-specific state here
  // e.g., const [roleFilter, setRoleFilter] = useState<RoleName[]>([]);
  // e.g., const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('all');

  return {
    ...paginationSearch,
  };
}
