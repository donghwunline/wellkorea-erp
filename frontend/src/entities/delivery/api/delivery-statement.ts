/**
 * Delivery Statement PDF API functions.
 *
 * Statement PDF generation and download operations.
 */

import { httpClient, DELIVERY_ENDPOINTS } from '@/shared/api';

/**
 * Generate delivery statement PDF.
 *
 * @param id - Delivery ID
 * @returns PDF as Blob
 */
export async function generateDeliveryStatementPdf(id: number): Promise<Blob> {
  const response = await httpClient.requestRaw<ArrayBuffer>({
    method: 'GET',
    url: DELIVERY_ENDPOINTS.statement(id),
    responseType: 'arraybuffer',
  });
  return new Blob([response], { type: 'application/pdf' });
}

/**
 * Download delivery statement PDF.
 *
 * Generates statement PDF and triggers browser download.
 *
 * @param id - Delivery ID
 * @param filename - Optional custom filename (default: delivery-statement-{id}.pdf)
 */
export async function downloadDeliveryStatement(id: number, filename?: string): Promise<void> {
  const blob = await generateDeliveryStatementPdf(id);
  const url = globalThis.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename ?? `delivery-statement-${id}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  globalThis.URL.revokeObjectURL(url);
}
