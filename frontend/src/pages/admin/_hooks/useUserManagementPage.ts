/**
 * Page-level hook for UserManagementPage
 *
 * Contains only Page UI State (Tier 2):
 * - Search/filter/sort/pagination state
 * - Event handlers for these UI controls
 * - Server state is managed via React Query (not included here)
 *
 * Modal state and form state are Local UI State (Tier 1) - kept in form components
 */

import { useState, useCallback } from 'react';

export interface UseUserManagementPageReturn {
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

export function useUserManagementPage(): UseUserManagementPageReturn {
  // Pagination state (Page UI State)
  const [page, setPage] = useState(0);

  // Search state (Page UI State)
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Search handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (value.length === 0) {
      setSearch('');
      setPage(0);
    }
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    setSearch('');
    setPage(0);
  }, []);

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
