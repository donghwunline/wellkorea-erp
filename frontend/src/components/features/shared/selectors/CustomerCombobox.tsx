/**
 * CustomerCombobox - Reusable Customer Selector Component
 *
 * A specialized Combobox for selecting customers.
 * Uses companyService with roleType: 'CUSTOMER' filter.
 *
 * Usage:
 * ```tsx
 * <CustomerCombobox
 *   value={selectedCustomerId}
 *   onChange={setSelectedCustomerId}
 *   label="Customer"
 *   required
 * />
 * ```
 */

import { useCallback } from 'react';
import { companyService } from '@/services';
import { Combobox, type ComboboxOption } from '@/components/ui';

export interface CustomerComboboxProps {
  /** Currently selected customer ID */
  value: number | null;
  /** Called when selection changes */
  onChange: (customerId: number | null) => void;
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
}

/**
 * Customer selector component that wraps Combobox with companyService.
 */
export function CustomerCombobox({
  value,
  onChange,
  label,
  placeholder = 'Search for a customer...',
  required,
  disabled,
  error,
  helpText,
  className,
}: Readonly<CustomerComboboxProps>) {
  /**
   * Load customers from API based on search query.
   * Filters by roleType: 'CUSTOMER' to get only customer companies.
   */
  const loadCustomers = useCallback(async (query: string): Promise<ComboboxOption[]> => {
    const result = await companyService.getCompanies({
      search: query,
      roleType: 'CUSTOMER',
      page: 0,
      size: 20,
    });

    return result.data.map(company => ({
      id: company.id,
      label: company.name,
      description: company.email || undefined,
    }));
  }, []);

  /**
   * Handle selection change.
   * Converts ComboboxOption to customer ID.
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
      loadOptions={loadCustomers}
      label={label}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      error={error}
      helpText={helpText}
      className={className}
    />
  );
}
