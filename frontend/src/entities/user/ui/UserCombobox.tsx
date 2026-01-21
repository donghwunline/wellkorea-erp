/**
 * User Combobox.
 *
 * Entity selector component for choosing a user.
 * Uses Query Factory pattern with fetchQuery for async loading.
 *
 * Entity UI rules:
 * - No router dependencies
 * - No mutation hooks
 * - Receives value and delegates changes via props
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Combobox, type ComboboxOption } from '@/shared/ui';
import { userQueries } from '../api/user.queries';

export interface UserComboboxProps {
  /**
   * Selected user ID, or null if nothing selected.
   */
  value: number | null;

  /**
   * Callback fired when selection changes.
   */
  onChange: (userId: number | null) => void;

  /**
   * Field label.
   */
  label?: string;

  /**
   * Placeholder text.
   */
  placeholder?: string;

  /**
   * Initial display label for the selected user.
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
 * User selector combobox with async search.
 *
 * @example
 * ```tsx
 * <UserCombobox
 *   value={formData.approverId}
 *   onChange={(id) => setFormData({ ...formData, approverId: id })}
 *   label="결재자"
 *   required
 * />
 * ```
 */
export function UserCombobox({
  value,
  onChange,
  label,
  placeholder,
  initialLabel,
  required,
  disabled,
  error,
  helpText,
  className,
}: Readonly<UserComboboxProps>) {
  const { t } = useTranslation('entities');
  const queryClient = useQueryClient();
  const defaultPlaceholder = placeholder ?? t('user.combobox.placeholder');

  /**
   * Load users using Query Factory pattern.
   * Uses fetchQuery for imperative data fetching with caching.
   */
  const loadOptions = useCallback(
    async (query: string): Promise<ComboboxOption[]> => {
      const result = await queryClient.fetchQuery(
        userQueries.list({
          page: 0,
          size: 20,
          search: query,
        })
      );

      return result.data.map(user => ({
        id: user.id,
        label: user.fullName || user.username,
        description: user.email,
      }));
    },
    [queryClient]
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
      placeholder={defaultPlaceholder}
      initialLabel={initialLabel ?? undefined}
      required={required}
      disabled={disabled}
      error={error}
      helpText={helpText}
      className={className}
      noResultsText={t('user.combobox.noResults')}
      loadingText={t('user.combobox.loading')}
    />
  );
}
