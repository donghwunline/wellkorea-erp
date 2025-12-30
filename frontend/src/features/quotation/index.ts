/**
 * Quotation Features - Public API.
 *
 * Exports all quotation user action features.
 * Each feature is an isolated unit with its own mutation hook.
 *
 * FSD Layer: features
 * Can import from: entities, shared
 * Cannot import from: other features, widgets, pages
 */

// Create quotation
export { useCreateQuotation, type UseCreateQuotationOptions } from './create';

// Update quotation
export {
  useUpdateQuotation,
  type UseUpdateQuotationOptions,
  type UpdateQuotationParams,
} from './update';

// Submit for approval
export { useSubmitQuotation, type UseSubmitQuotationOptions } from './submit';

// Create new version
export { useCreateVersion, type UseCreateVersionOptions } from './version';

// Download PDF
export { useDownloadPdf, type UseDownloadPdfOptions, type DownloadPdfParams } from './download-pdf';

// Send notification
export {
  useSendNotification,
  type UseSendNotificationOptions,
  EmailNotificationModal,
  type EmailNotificationModalProps,
} from './notify';

// Form UI component
export { QuotationForm, type QuotationFormProps } from './form';
