/**
 * Download Quotation PDF Mutation Hook.
 *
 * Handles downloading a quotation as a PDF file.
 *
 * Features Layer: Isolated user action
 * - Contains mutation logic
 * - No cache invalidation needed (read-only operation)
 * - UX side-effects (toast, file download) belong here
 */

import { useMutation } from '@tanstack/react-query';
import { downloadQuotationPdf } from '@/entities/quotation';

export interface UseDownloadPdfOptions {
  /**
   * Called on successful download.
   */
  onSuccess?: () => void;

  /**
   * Called on error.
   */
  onError?: (error: Error) => void;
}

export interface DownloadPdfParams {
  quotationId: number;
  filename?: string;
}

/**
 * Hook for downloading a quotation as PDF.
 *
 * Only valid for quotations with status != DRAFT.
 *
 * @example
 * ```tsx
 * function DownloadPdfButton({ quotation }: { quotation: Quotation }) {
 *   const { mutate, isPending } = useDownloadPdf({
 *     onSuccess: () => toast.success('PDF downloaded'),
 *     onError: (error) => toast.error(error.message),
 *   });
 *
 *   if (!quotationRules.canGeneratePdf(quotation)) return null;
 *
 *   const filename = `quotation-${quotation.jobCode}-v${quotation.version}.pdf`;
 *
 *   return (
 *     <Button
 *       onClick={() => mutate({ quotationId: quotation.id, filename })}
 *       loading={isPending}
 *     >
 *       Download PDF
 *     </Button>
 *   );
 * }
 * ```
 */
export function useDownloadPdf(options: UseDownloadPdfOptions = {}) {
  return useMutation({
    mutationFn: async ({ quotationId, filename }: DownloadPdfParams) => {
      await downloadQuotationPdf(quotationId, filename);
    },

    onSuccess: () => {
      options.onSuccess?.();
    },

    onError: (error: Error) => {
      options.onError?.(error);
    },
  });
}
