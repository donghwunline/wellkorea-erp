/**
 * Hook for quotation actions.
 * Encapsulates quotation service calls with loading and error state.
 *
 * CQRS Pattern: Command actions (create, update, submit, createNewVersion)
 * return CommandResult with only { id, message }. Use getQuotation() to
 * fetch full details after a command operation if needed.
 */

import { useCallback, useState } from 'react';
import { quotationService } from '@/services';
import type {
  CommandResult,
  CreateQuotationRequest,
  QuotationDetails,
  UpdateQuotationRequest,
} from '@/services';

export interface UseQuotationActionsReturn {
  isLoading: boolean;
  error: string | null;
  getQuotation: (id: number) => Promise<QuotationDetails>;
  createQuotation: (data: CreateQuotationRequest) => Promise<CommandResult>;
  updateQuotation: (id: number, data: UpdateQuotationRequest) => Promise<CommandResult>;
  submitForApproval: (id: number) => Promise<CommandResult>;
  createNewVersion: (id: number) => Promise<CommandResult>;
  downloadPdf: (id: number, filename?: string) => Promise<void>;
  sendRevisionNotification: (id: number) => Promise<void>;
  clearError: () => void;
}

/**
 * Hook that provides quotation action handlers with loading and error state.
 */
export function useQuotationActions(): UseQuotationActionsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getQuotation = useCallback(
    async (id: number): Promise<QuotationDetails> => {
      setIsLoading(true);
      setError(null);
      try {
        const quotation = await quotationService.getQuotation(id);
        return quotation;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const createQuotation = useCallback(
    async (data: CreateQuotationRequest): Promise<CommandResult> => {
      setIsLoading(true);
      setError(null);
      try {
        return await quotationService.createQuotation(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateQuotation = useCallback(
    async (id: number, data: UpdateQuotationRequest): Promise<CommandResult> => {
      setIsLoading(true);
      setError(null);
      try {
        return await quotationService.updateQuotation(id, data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const submitForApproval = useCallback(async (id: number): Promise<CommandResult> => {
    setIsLoading(true);
    setError(null);
    try {
      return await quotationService.submitForApproval(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNewVersion = useCallback(async (id: number): Promise<CommandResult> => {
    setIsLoading(true);
    setError(null);
    try {
      return await quotationService.createNewVersion(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const downloadPdf = useCallback(async (id: number, filename?: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await quotationService.downloadPdf(id, filename);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendRevisionNotification = useCallback(async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await quotationService.sendRevisionNotification(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    getQuotation,
    createQuotation,
    updateQuotation,
    submitForApproval,
    createNewVersion,
    downloadPdf,
    sendRevisionNotification,
    clearError,
  };
}
