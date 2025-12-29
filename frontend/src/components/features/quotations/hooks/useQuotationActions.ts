/**
 * Hook for quotation actions.
 * Encapsulates quotation service calls with loading and error state.
 *
 * CQRS Pattern: Command actions (create, update, submit, createNewVersion)
 * return CommandResult with only { id, message }. Use getQuotation() to
 * fetch full details after a command operation if needed.
 */

import { useCallback, useMemo } from 'react';
import { useServiceActions } from '@/shared/hooks';
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
  const { isLoading, error, clearError, wrapAction } = useServiceActions();

  const getQuotation = useCallback(
    (id: number) => wrapAction(quotationService.getQuotation, 'Failed to load quotation')(id),
    [wrapAction]
  );

  const createQuotation = useCallback(
    (data: CreateQuotationRequest) =>
      wrapAction(quotationService.createQuotation, 'Failed to create quotation')(data),
    [wrapAction]
  );

  const updateQuotation = useCallback(
    (id: number, data: UpdateQuotationRequest) =>
      wrapAction(
        (i: number, d: UpdateQuotationRequest) => quotationService.updateQuotation(i, d),
        'Failed to update quotation'
      )(id, data),
    [wrapAction]
  );

  const submitForApproval = useCallback(
    (id: number) =>
      wrapAction(quotationService.submitForApproval, 'Failed to submit for approval')(id),
    [wrapAction]
  );

  const createNewVersion = useCallback(
    (id: number) =>
      wrapAction(quotationService.createNewVersion, 'Failed to create new version')(id),
    [wrapAction]
  );

  const downloadPdf = useCallback(
    (id: number, filename?: string) =>
      wrapAction(
        (i: number, f?: string) => quotationService.downloadPdf(i, f),
        'Failed to download PDF'
      )(id, filename),
    [wrapAction]
  );

  const sendRevisionNotification = useCallback(
    (id: number) =>
      wrapAction(
        quotationService.sendRevisionNotification,
        'Failed to send revision notification'
      )(id),
    [wrapAction]
  );

  return useMemo(
    () => ({
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
    }),
    [
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
    ]
  );
}
