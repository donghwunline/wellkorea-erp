/**
 * Generic pagination + search state hook
 *
 * Reusable across any page/feature that needs pagination and search.
 * Returns all state and handlers needed for pagination/search UI.
 *
 * @example
 * ```typescript
 * const { page, setPage, search, searchInput, handleSearchChange } = usePaginatedSearch();
 *
 * <SearchBar value={searchInput} onChange={handleSearchChange} />
 * <Table data={filteredData} page={page} />
 * <Pagination currentPage={page} onPageChange={setPage} />
 * ```
 */

import { useState, useCallback } from 'react';

export interface UsePaginatedSearchOptions {
  initialPage?: number;
  initialSearch?: string;
}

export interface UsePaginatedSearchReturn {
  // Pagination
  page: number;
  setPage: (page: number) => void;

  // Search
  search: string;
  searchInput: string;
  handleSearchChange: (value: string) => void;
  handleSearchSubmit: () => void;
  handleClearSearch: () => void;
}

/**
 * Hook for managing pagination and search state.
 *
 * Features:
 * - Separates search input (typing) from search value (submitted)
 * - Auto-clears search when input is emptied
 * - Resets pagination when search changes
 */
export function usePaginatedSearch(
  options: UsePaginatedSearchOptions = {}
): UsePaginatedSearchReturn {
  const { initialPage = 0, initialSearch = '' } = options;

  // Pagination state
  const [page, setPage] = useState(initialPage);

  // Search state (input = typing buffer, search = submitted value)
  const [search, setSearch] = useState(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch);

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    // Auto-clear when input is emptied
    if (value.length === 0) {
      setSearch('');
      setPage(0);
    }
  }, []);

  // Clear search completely
  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    setSearch('');
    setPage(0);
  }, []);

  // Submit search (user presses Enter or clicks Search button)
  const handleSearchSubmit = useCallback(() => {
    setSearch(searchInput);
    setPage(0);
  }, [searchInput]);

  return {
    // Pagination
    page,
    setPage,

    // Search
    search,
    searchInput,
    handleSearchChange,
    handleSearchSubmit,
    handleClearSearch,
  };
}
