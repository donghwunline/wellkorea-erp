/**
 * Company Combobox.
 *
 * Entity selector component for choosing a company.
 * Uses async loading with the company query factory.
 *
 * Entity UI rules:
 * - No router dependencies
 * - No mutation hooks
 * - Receives value and delegates changes via props
 */

import { useCallback } from 'react';
import { Combobox, type ComboboxOption } from '@/shared/ui';
import { httpClient, COMPANY_ENDPOINTS, transformPagedResponse } from '@/shared/api';
import type { PagedResponse } from '@/shared/api/types';
import type { RoleType } from '../model/role-type';
import { ROLE_TYPE_LABELS } from '../model/role-type';

// Inline type for API response (avoid circular import from dto)
interface CompanySummaryResponse {
  id: number;
  name: string;
  email?: string | null;
  contactPerson?: string | null;
  roles: Array<{ id: number; roleType: RoleType }>;
}

export interface CompanyComboboxProps {
  /**
   * Selected company ID, or null if nothing selected.
   */
  value: number | null;

  /**
   * Callback fired when selection changes.
   */
  onChange: (companyId: number | null) => void;

  /**
   * Optional role type filter.
   * When provided, only companies with this role will be shown.
   */
  roleType?: RoleType;

  /**
   * Field label.
   */
  label?: string;

  /**
   * Placeholder text.
   */
  placeholder?: string;

  /**
   * Initial display label for the selected company.
   * Used when value is pre-selected but options haven't loaded.
   */
  initialLabel?: string | null;

  /**
   * Whether the field is required.
   */
  required?: boolean;

  /**
   * Whether the field is disabled.
   */
  disabled?: boolean;

  /**
   * Error message.
   */
  error?: string;

  /**
   * Help text shown below the input.
   */
  helpText?: string;

  /**
   * Additional CSS classes.
   */
  className?: string;
}

/**
 * Company selector combobox with async search.
 *
 * @example
 * ```tsx
 * <CompanyCombobox
 *   value={formData.customerId}
 *   onChange={(id) => setFormData({ ...formData, customerId: id })}
 *   roleType="CUSTOMER"
 *   label="Customer"
 *   required
 * />
 * ```
 */
export function CompanyCombobox({
  value,
  onChange,
  roleType,
  label,
  placeholder,
  initialLabel,
  required,
  disabled,
  error,
  helpText,
  className,
}: Readonly<CompanyComboboxProps>) {
  const defaultPlaceholder = roleType
    ? `${ROLE_TYPE_LABELS[roleType]} 검색...`
    : '회사 검색...';

  /**
   * Load companies from API based on search query.
   */
  const loadOptions = useCallback(
    async (query: string): Promise<ComboboxOption[]> => {
      const response = await httpClient.requestWithMeta<PagedResponse<CompanySummaryResponse>>({
        method: 'GET',
        url: COMPANY_ENDPOINTS.BASE,
        params: {
          page: 0,
          size: 20,
          search: query || undefined,
          roleType: roleType ?? undefined,
        },
      });

      const paginated = transformPagedResponse(response.data, response.metadata);

      return paginated.data.map(company => ({
        id: company.id,
        label: company.name,
        description: company.email || company.contactPerson || undefined,
      }));
    },
    [roleType]
  );

  /**
   * Handle selection change.
   * Convert to number (Combobox uses string | number).
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
      loadOptions={loadOptions}
      label={label}
      placeholder={placeholder ?? defaultPlaceholder}
      initialLabel={initialLabel ?? undefined}
      required={required}
      disabled={disabled}
      error={error}
      helpText={helpText}
      className={className}
      noResultsText="검색 결과가 없습니다"
      loadingText="로딩 중..."
    />
  );
}
