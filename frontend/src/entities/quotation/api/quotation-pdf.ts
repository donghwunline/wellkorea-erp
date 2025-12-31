/**
 * Quotation PDF API functions.
 *
 * PDF generation and download operations.
 */

import { httpClient, QUOTATION_ENDPOINTS } from '@/shared/api';

/**
 * Generate PDF for a quotation.
 *
 * @param id - Quotation ID
 * @returns PDF as Blob
 */
export async function generateQuotationPdf(id: number): Promise<Blob> {
  const response = await httpClient.requestRaw<ArrayBuffer>({
    method: 'POST',
    url: QUOTATION_ENDPOINTS.pdf(id),
    responseType: 'arraybuffer',
  });
  return new Blob([response], { type: 'application/pdf' });
}

/**
 * Download PDF for a quotation.
 *
 * Generates PDF and triggers browser download.
 *
 * @param id - Quotation ID
 * @param filename - Optional custom filename (default: quotation-{id}.pdf)
 */
export async function downloadQuotationPdf(id: number, filename?: string): Promise<void> {
  const blob = await generateQuotationPdf(id);
  const url = globalThis.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename ?? `quotation-${id}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  globalThis.URL.revokeObjectURL(url);
}
