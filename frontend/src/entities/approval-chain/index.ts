/**
 * Approval Chain Entity - Public API.
 *
 * This is the ONLY entry point for importing from the approval-chain entity.
 * Internal modules (model/, api/) should never be imported directly.
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
// COMMAND FUNCTIONS
// =============================================================================

export { updateChainLevels } from './api/update-chain-levels';
