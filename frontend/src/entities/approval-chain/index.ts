/**
 * Approval Chain Entity - Public API.
 *
 * Complete FSD entity module for approval chain templates.
 *
 * Exports:
 * - Domain models and business rules
 * - Query hooks and keys
 * - API layer (for advanced use cases)
 *
 * Note: Mutations are in features/approval-chain/
 */

// Model layer
export type { ChainLevel, ChainTemplate, ChainLevelInput } from './model';
export { chainTemplateRules } from './model';

// API layer
export { chainTemplateApi, chainTemplateMapper } from './api';
export type {
  ChainTemplateDTO,
  ChainLevelDTO,
  ChainLevelRequestDTO,
  UpdateChainLevelsRequestDTO,
} from './api';

// Query layer
export {
  chainTemplateQueryKeys,
  chainTemplateQueryFns,
  useChainTemplates,
  useChainTemplate,
} from './query';
export type { UseChainTemplatesOptions, UseChainTemplateOptions } from './query';
