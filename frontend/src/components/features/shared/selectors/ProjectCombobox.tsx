/**
 * ProjectCombobox - Reusable Project Selector Component
 *
 * A specialized Combobox for selecting projects.
 * Encapsulates projectService calls and provides consistent project selection UI.
 *
 * Usage:
 * ```tsx
 * <ProjectCombobox
 *   value={selectedProjectId}
 *   onChange={setSelectedProjectId}
 *   label="Project"
 *   required
 * />
 * ```
 */

import { useCallback } from 'react';
import { projectService } from '@/services';
import { Combobox, type ComboboxOption } from '@/components/ui';

export interface ProjectComboboxProps {
  /** Currently selected project ID */
  value: number | null;
  /** Called when selection changes */
  onChange: (projectId: number | null) => void;
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
 * Project selector component that wraps Combobox with projectService.
 */
export function ProjectCombobox({
  value,
  onChange,
  label,
  placeholder = 'Search for a project...',
  required,
  disabled,
  error,
  helpText,
  className,
}: Readonly<ProjectComboboxProps>) {
  /**
   * Load projects from API based on search query.
   * Transforms ProjectDetails to ComboboxOption format.
   */
  const loadProjects = useCallback(async (query: string): Promise<ComboboxOption[]> => {
    const result = await projectService.getProjects({
      search: query,
      page: 0,
      size: 20,
    });

    return result.data.map(project => ({
      id: project.id,
      label: project.projectName,
      description: project.jobCode || undefined,
    }));
  }, []);

  /**
   * Handle selection change.
   * Converts ComboboxOption to project ID.
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
      loadOptions={loadProjects}
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
