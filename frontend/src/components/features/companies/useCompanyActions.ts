/**
 * Company Actions Hook
 *
 * Manages company CRUD operations with loading and error states.
 */

import { useState, useCallback } from 'react';
import { companyService } from '@/services';
import type {
  CompanyDetails,
  CreateCompanyRequest,
  UpdateCompanyRequest,
  CompanyCommandResult,
} from '@/services';

interface UseCompanyActionsReturn {
  // State
  isLoading: boolean;
  error: string | null;

  // Actions
  createCompany: (request: CreateCompanyRequest) => Promise<CompanyCommandResult>;
  updateCompany: (id: number, request: UpdateCompanyRequest) => Promise<CompanyCommandResult>;
  getCompany: (id: number) => Promise<CompanyDetails>;
  deleteCompany: (id: number) => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing company actions with loading and error states.
 */
export function useCompanyActions(): UseCompanyActionsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCompany = useCallback(async (request: CreateCompanyRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      return await companyService.createCompany(request);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create company';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCompany = useCallback(async (id: number, request: UpdateCompanyRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      return await companyService.updateCompany(id, request);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update company';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCompany = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      return await companyService.getCompany(id);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load company';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteCompany = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await companyService.deleteCompany(id);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete company';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    createCompany,
    updateCompany,
    getCompany,
    deleteCompany,
    clearError,
  };
}
