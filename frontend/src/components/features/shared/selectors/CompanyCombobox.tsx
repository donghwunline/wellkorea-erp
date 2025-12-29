/**
 * CompanyCombobox - Reusable Company Selector Component
 *
 * A specialized Combobox for selecting companies.
 * Supports filtering by role type (CUSTOMER, VENDOR, OUTSOURCE).
 *
 * Usage:
 * ```tsx
 * <CompanyCombobox
 *   value={selectedCompanyId}
 *   onChange={setSelectedCompanyId}
 *   roleType="CUSTOMER"
 *   label="Customer"
 *   required
 * />
 * ```
 */

import { useCallback } from 'react';
import { companyService, ROLE_TYPE_LABELS } from '@/services';
import type { RoleType } from '@/services';
import { Combobox, type ComboboxOption } from '@/components/ui';

export interface CompanyComboboxProps {
  /** Currently selected company ID */
  value: number | null;
  /** Called when selection changes */
  onChange: (companyId: number | null) => void;
  /** Filter by role type (optional) */
  roleType?: RoleType;
  /** Field label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether field is required */
  required?: boolean;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Error message */
  error?: string;
  /** Help text shown below field */
  helpText?: string;
  /** Additional class name */
  className?: string;
  /** Initial label for pre-selected value (used in edit mode before options load) */
  initialLabel?: string | null;
}

/**
 * Company selector component that wraps Combobox with companyService.
 */
export function CompanyCombobox({
  value,
  onChange,
  roleType,
  label,
  placeholder,
  required,
  disabled,
  error,
  helpText,
  className,
  initialLabel,
}: Readonly<CompanyComboboxProps>) {
  // Generate default placeholder based on roleType
  const defaultPlaceholder = roleType
    ? `Search for a ${ROLE_TYPE_LABELS[roleType].toLowerCase()}...`
    : 'Search for a company...';

  /**
   * Load companies from API based on search query.
   * Transforms CompanySummary to ComboboxOption format.
   */
  const loadCompanies = useCallback(
    async (query: string): Promise<ComboboxOption[]> => {
      const result = await companyService.getCompanies({
        search: query,
        page: 0,
        size: 20,
        roleType,
      });

      return result.data.map(company => ({
        id: company.id,
        label: company.name,
        description: company.email || company.contactPerson || undefined,
      }));
    },
    [roleType]
  );

  /**
   * Handle selection change.
   * Converts ComboboxOption to company ID.
   */
  const handleChange = useCallback(
    (id: string | number | null) => {
      onChange(id === null ? null : Number(id));
    },
    [onChange]
  );

  return (
    <Combobox
      value={value}
      onChange={handleChange}
      loadOptions={loadCompanies}
      label={label}
      placeholder={placeholder ?? defaultPlaceholder}
      required={required}
      disabled={disabled}
      error={error}
      helpText={helpText}
      className={className}
      initialLabel={initialLabel}
    />
  );
}
