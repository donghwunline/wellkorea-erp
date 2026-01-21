/**
 * Project Combobox.
 *
 * Entity selector component for choosing a project.
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
import { projectQueries } from '../api/project.queries';

export interface ProjectComboboxProps {
  /**
   * Selected project ID, or null if nothing selected.
   */
  value: number | null;

  /**
   * Callback fired when selection changes.
   */
  onChange: (projectId: number | null) => void;

  /**
   * Field label.
   */
  label?: string;

  /**
   * Placeholder text.
   */
  placeholder?: string;

  /**
   * Initial display label for the selected project.
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
 * Project selector combobox with async search.
 *
 * @example
 * ```tsx
 * <ProjectCombobox
 *   value={formData.projectId}
 *   onChange={(id) => setFormData({ ...formData, projectId: id })}
 *   label="프로젝트"
 *   required
 * />
 * ```
 */
export function ProjectCombobox({
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
}: Readonly<ProjectComboboxProps>) {
  const { t } = useTranslation('entities');
  const queryClient = useQueryClient();
  const defaultPlaceholder = placeholder ?? t('project.combobox.placeholder');

  /**
   * Load projects using Query Factory pattern.
   * Uses fetchQuery for imperative data fetching with caching.
   */
  const loadOptions = useCallback(
    async (query: string): Promise<ComboboxOption[]> => {
      const result = await queryClient.fetchQuery(
        projectQueries.list({
          page: 0,
          size: 20,
          search: query,
          status: null,
        })
      );

      return result.data.map(project => ({
        id: project.id,
        label: project.projectName,
        description: project.jobCode || undefined,
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
      noResultsText={t('project.combobox.noResults')}
      loadingText={t('project.combobox.loading')}
    />
  );
}
