/**
 * Company Features - Public API.
 *
 * Exports all company user action features.
 * Each feature is an isolated unit with its own mutation hook.
 *
 * FSD Layer: features
 * Can import from: entities, shared
 * Cannot import from: other features, widgets, pages
 */

// Create company
export { useCreateCompany, type UseCreateCompanyOptions } from './create';

// Update company
export {
  useUpdateCompany,
  type UseUpdateCompanyOptions,
  type UpdateCompanyParams,
} from './update';

// Add role to company
export {
  useAddRole,
  type UseAddRoleOptions,
  type AddRoleParams,
} from './add-role';

// Remove role from company
export {
  useRemoveRole,
  type UseRemoveRoleOptions,
  type RemoveRoleParams,
} from './remove-role';
