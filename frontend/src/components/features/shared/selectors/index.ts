/**
 * Shared Selector Components
 *
 * Reusable combobox components that encapsulate service calls.
 * Use these instead of raw Combobox + loadOptions pattern.
 *
 * Usage:
 * ```tsx
 * import { UserCombobox, CustomerCombobox } from '@/components/features/shared/selectors';
 *
 * <UserCombobox value={userId} onChange={setUserId} label="Approver" />
 * <CustomerCombobox value={customerId} onChange={setCustomerId} label="Customer" required />
 * ```
 */

export { UserCombobox, type UserComboboxProps } from './UserCombobox';
export { CustomerCombobox, type CustomerComboboxProps } from './CustomerCombobox';
export { ProjectCombobox, type ProjectComboboxProps } from './ProjectCombobox';
export { ProductCombobox, type ProductComboboxProps } from './ProductCombobox';
