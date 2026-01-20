/**
 * Quotation Entity - Public API.
 *
 * This is the ONLY entry point for importing from the quotation entity.
 * Internal modules (model/, api/, ui/) should never be imported directly.
 *
 * FSD Layer: entities
 * Can import from: shared
 * Cannot import from: features, widgets, pages
 *
 * @see docs/architecture/fsd-public-api-guidelines.md
 */

// =============================================================================
// DOMAIN TYPES
// Types that appear in component props, state, or function signatures
// =============================================================================

export type { Quotation, QuotationListItem } from './model/quotation';
export type { LineItem } from './model/line-item';

// =============================================================================
// STATUS
// Status enum and config for conditional rendering and business logic
// =============================================================================

export { QuotationStatus, QuotationStatusConfig } from './model/quotation-status';

// =============================================================================
// BUSINESS RULES
// Pure functions for domain logic (canEdit, canSubmit, calculations)
// =============================================================================

export { quotationRules } from './model/quotation';

// =============================================================================
// QUERY FACTORY (TanStack Query v5)
// Use with useQuery() directly - no custom hooks needed
// =============================================================================

export { quotationQueries, type QuotationListQueryParams } from './api/quotation.queries';

// =============================================================================
// COMMAND FUNCTIONS (with validation)
// Use with useMutation() directly
// =============================================================================

export {
  createQuotation,
  type CreateQuotationInput,
  type LineItemInput,
} from './api/create-quotation';
export { updateQuotation, type UpdateQuotationInput } from './api/update-quotation';
export { submitQuotation } from './api/submit-quotation';
export { acceptQuotation } from './api/accept-quotation';
export { createQuotationVersion } from './api/create-quotation-version';

// Command result type (shared across commands)
export type { CommandResult } from './api/quotation.mapper';

// =============================================================================
// OTHER API FUNCTIONS
// =============================================================================

export { downloadQuotationPdf } from './api/quotation-pdf';
export {
  sendQuotationNotification,
  type SendNotificationInput,
} from './api/send-quotation-notification';

// =============================================================================
// UI COMPONENTS
// Display-only components with no side effects
// =============================================================================

export { QuotationStatusBadge } from './ui/QuotationStatusBadge';
export { QuotationCard } from './ui/QuotationCard';
export { QuotationTable } from './ui/QuotationTable';
