/**
 * Mail Config Entity - Public API.
 *
 * Entity for Microsoft Graph OAuth2 mail configuration.
 *
 * FSD Layer: entities
 * Can import from: shared
 */

// =============================================================================
// DOMAIN TYPES
// =============================================================================

export type { MailConfigStatus } from './model/mail-config';

// =============================================================================
// QUERY FACTORY (TanStack Query v5)
// =============================================================================

export { mailConfigQueries } from './api/mail-config.queries';

// =============================================================================
// COMMAND FUNCTIONS
// =============================================================================

export { getAuthorizationUrl } from './api/get-mail-config';
export { disconnectMail } from './api/disconnect-mail';
