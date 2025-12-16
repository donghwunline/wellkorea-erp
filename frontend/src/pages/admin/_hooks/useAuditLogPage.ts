/**
 * Page-level hook for AuditLogPage
 *
 * Contains only Page UI State (Tier 2):
 * - Filter/sort/pagination state
 * - Event handlers for these UI controls
 * - Server state is managed via React Query (not included here)
 *
 * Modal state is Local UI State (Tier 1) - kept in page component
 */

import { useState, useCallback } from 'react';

export interface UseAuditLogPageReturn {
  // Pagination
  page: number;
  setPage: (page: number) => void;

  // Filters
  filters: {
    username: string;
    action: string;
    startDate: string;
    endDate: string;
  };
  handleFilterChange: (key: string, value: string) => void;
  handleClearFilters: () => void;
}

export function useAuditLogPage(): UseAuditLogPageReturn {
  // Pagination state (Page UI State)
  const [page, setPage] = useState(0);

  // Filter state (Page UI State)
  const [filters, setFilters] = useState({
    username: '',
    action: '',
    startDate: '',
    endDate: '',
  });

  // Filter handlers
  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0); // Reset to first page when filter changes
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      username: '',
      action: '',
      startDate: '',
      endDate: '',
    });
    setPage(0);
  }, []);

  return {
    // Pagination
    page,
    setPage,

    // Filters
    filters,
    handleFilterChange,
    handleClearFilters,
  };
}
