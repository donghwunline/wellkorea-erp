/**
 * Approval Chain Entity - Public API.
 *
 * This is the ONLY entry point for importing from the approval-chain entity.
 * Internal modules (model/, api/, query/) should never be imported directly.
 *
 * FSD Layer: entities
 * Can import from: shared
 * Cannot import from: features, widgets, pages
 *
 * Note: Mutations are in features/approval-chain/
 *
 * @see docs/architecture/fsd-public-api-guidelines.md
 */

// =============================================================================
// DOMAIN TYPES
// Types that appear in component props, state, or function signatures
// =============================================================================

export type { ChainLevel, ChainTemplate, ChainLevelInput } from './model/chain-template';

// =============================================================================
// BUSINESS RULES
// Pure functions for domain logic
// =============================================================================

export { chainTemplateRules } from './model/chain-template';

// =============================================================================
// QUERY FACTORY (TanStack Query v5 pattern)
// Primary data access interface - use with useQuery() directly
// =============================================================================

export { chainTemplateQueries } from './api/chain-template.queries';

// =============================================================================
// API ACCESS (for features layer mutations only)
// These are needed by features/approval-chain/* for CRUD operations
// =============================================================================

export { chainTemplateApi } from './api/chain-template.api';
export { chainTemplateMapper } from './api/chain-template.mapper';
export type {
  ChainTemplateDTO,
  ChainLevelDTO,
  ChainLevelRequestDTO,
  UpdateChainLevelsRequestDTO,
} from './api/chain-template.dto';
